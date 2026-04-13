import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';
 
if (!process.env.DATABASE_URL) {
    throw new Error('FATAL: DATABASE_URL environment variable is missing!');
}

// TITAN-GRADE POSTGRESQL POOL
// Native support for Neon.tech and Vercel Edge performance requirements.
const originalUrl = process.env.DATABASE_URL;
let connectionString = originalUrl;

// TITAN AUTO-SILENCE: Append uselibpqcompat=true to suppress SSL warnings in logs
if (connectionString?.includes('sslmode=') && !connectionString.includes('uselibpqcompat=true')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    connectionString += `${separator}uselibpqcompat=true`;
}

const isCloudDB = connectionString?.includes('supabase') || 
                  connectionString?.includes('neon') || 
                  connectionString?.includes('.aivencloud.com');

const pool = new Pool({ 
    connectionString: connectionString,
    connectionTimeoutMillis: 10000, 
    max: 10, 
    ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

// Cache for translated SQL to avoid regex overhead on every query
const translationCache = new Map();
const MAX_CACHE_SIZE = 500;

/**
 * TITAN QUERY TRANSLATOR
 * Automatically adapts MSSQL syntax to PostgreSQL at runtime.
 * Supports: @params -> $n, TOP -> LIMIT, GETDATE() -> NOW(), [col] -> "col"
 */
function translateSql(sql, params) {
    if (translationCache.has(sql)) {
        const cached = translationCache.get(sql);
        const mappedValues = [];
        if (params && cached.paramOrder) {
            for (const key of cached.paramOrder) {
                mappedValues.push(params[key]);
            }
        }
        return { sql: cached.translatedSql, values: mappedValues };
    }

    let translatedSql = sql;
    const values = [];
    const paramOrder = [];
    let paramCount = 1;

    // 1. Robust Named Param Mapping (@param -> $n)
    if (params && Object.keys(params).length > 0) {
        const keys = Object.keys(params).sort((a, b) => b.length - a.length);
        
        for (const key of keys) {
            const regex = new RegExp(`@${key}\\b`, 'gi');
            if (translatedSql.match(regex)) {
                translatedSql = translatedSql.replace(regex, `$${paramCount}`);
                values.push(params[key]);
                paramOrder.push(key);
                paramCount++;
            }
        }
    }

    // 2. String Concatenation Fix (MSSQL + to Postgres ||)
    // Converts $1 + '%' OR '%' + $1 OR 'A' + 'B'
    translatedSql = translatedSql.replace(/(\$\d+|'[^']*')\s*\+\s*(\$\d+|'[^']*')/gi, '$1 || $2');

    // 3. Robust TOP to LIMIT translation
    // Handles SELECT TOP 10 ..., SELECT DISTINCT TOP 10 ..., and subqueries
    // Postgres LIMIT must be at the end of the clause.
    // Refined: Stop only at query terminator (;) or end of string ($) to support subqueries.
    translatedSql = translatedSql.replace(/(SELECT\s+(?:DISTINCT\s+)?TOP\s+\(?(\d+|\$\d+)\)?)(.*?)(?=;|$)/gis, (match, prefix, limit, rest) => {
        const selectStmt = prefix.toUpperCase().includes('DISTINCT') ? 'SELECT DISTINCT' : 'SELECT';
        if (/\bLIMIT\b/i.test(rest)) return match;
        return `${selectStmt}${rest} LIMIT ${limit}`;
    });

    // 4. Common Function Mapping
    translatedSql = translatedSql.replace(/LIKE\s+N'/gi, "LIKE '");
    translatedSql = translatedSql.replace(/GETDATE\(\)/gi, 'NOW()');
    translatedSql = translatedSql.replace(/ISNULL/gi, 'COALESCE');
    translatedSql = translatedSql.replace(/LEN\s*\(/gi, 'LENGTH(');
    translatedSql = translatedSql.replace(/CHARINDEX\(([^,]+),\s*([^)]+)\)/gi, 'STRPOS($2, $1)');

    // 5. Convert DATEADD (e.g., DATEADD(hour, -1, GETDATE()) -> NOW() - INTERVAL '1 hour')
    // Supports hardcoded values, $1 placeholders, and @params
    translatedSql = translatedSql.replace(/DATEADD\s*\(\s*(\w+)\s*,\s*(-?\s*(?:\d+|\$\d+|@\w+))\s*,\s*([^)]+)\)/gi, (match, unit, amount, date) => {
        const isParam = amount.includes('$') || amount.includes('@');
        if (isParam) {
            // Complex case: dynamic interval
            return `(${date} + (${amount} * INTERVAL '1 ${unit}'))`;
        }
        const cleanAmount = amount.replace(/\s+/g, '');
        const absAmount = Math.abs(parseInt(cleanAmount));
        const sign = parseInt(cleanAmount) >= 0 ? '+' : '-';
        return `(${date} ${sign} INTERVAL '${absAmount} ${unit}')`;
    });

    // 6. Convert SQL Server specific operators (CROSS APPLY / OUTER APPLY / OUTPUT)
    translatedSql = translatedSql.replace(/CROSS APPLY/gi, 'CROSS JOIN LATERAL');
    translatedSql = translatedSql.replace(/OUTER APPLY/gi, 'LEFT JOIN LATERAL');
    translatedSql = translatedSql.replace(/OUTPUT\s+inserted\.(\w+)/gi, 'RETURNING $1');
    translatedSql = translatedSql.replace(/OUTPUT\s+inserted\.\*/gi, 'RETURNING *');

    // 7. Schema & Identifier Cleanup
    // More aggressive dbo removal to handle [dbo]. / "dbo". / dbo. prefixes
    translatedSql = translatedSql.replace(/(?:\[dbo\]|"dbo"|dbo)\./gi, ''); 
    translatedSql = translatedSql.replace(/\[([^\]]+)\]/g, '"$1"'); 

    // Cache the result for future identical queries
    if (translationCache.size < MAX_CACHE_SIZE) {
        translationCache.set(sql, { translatedSql, paramOrder });
    }

    return { sql: translatedSql, values };
}

export async function query(sqlString, params = {}) {
    const { sql: psql, values } = translateSql(sqlString, params);
    
    try {
        const result = await pool.query(psql, values);
        
        // Emulate mssql .recordset and .recordsets for backward compatibility
        return {
            recordset: result.rows,
            recordsets: [result.rows],
            rowsAffected: [result.rowCount],
            rowCount: result.rowCount
        };
    } catch (err) {
        // Always log translated SQL on error to assist production debugging
        console.error(`[PG ERROR] ${err.message} \nOriginal SQL: ${sqlString.substring(0, 300)} \nTranslated: ${psql.substring(0, 300)}`);
        throw err;
    }
}

/**
 * Managed Transaction for PostgreSQL
 */
export async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Titan bulkInsert optimized for PostgreSQL
 */
export async function bulkInsert(tableName, columns, rows) {
    if (!rows || rows.length === 0) return;
    
    const client = await pool.connect();
    try {
        // Force lowercase and unquote table/column names to avoid case-sensitivity issues in PG
        const cleanTable = tableName.replace(/[\[\]"]/g, '').toLowerCase();
        const colNames = columns.map(c => `"${c.toLowerCase()}"`).join(', ');
        const valuePlaceholders = [];
        const flatValues = [];
        
        const placeholders = rows.map((_, i) => 
            `(${columns.map((_, j) => {
                flatValues.push(rows[i][columns[j]]);
                return `$${i * columns.length + j + 1}`;
            }).join(', ')})`
        ).join(', ');

        const sql = `INSERT INTO ${cleanTable} (${colNames}) VALUES ${placeholders} ON CONFLICT DO NOTHING`;
        await client.query(sql, flatValues);
    } finally {
        client.release();
    }
}

export const MANGA_CARD_FIELDS = `id, title, cover, last_chap_num, rating, views, author, status, last_crawled`;

export async function cleanLegacyEncoding() {
    try {
        await query("UPDATE Manga SET last_chap_num = 'Đang cập nhật' WHERE last_chap_num = '??'");
        await query("UPDATE Manga SET author = 'Đang cập nhật' WHERE author = '??'");
        
        // TITAN SEARCH OPTIMIZATION: Ensure B-Tree indexes for fast prefix and fuzzy searches
        await query("CREATE INDEX IF NOT EXISTS idx_manga_normalized_title ON Manga(normalized_title)");
        await query("CREATE INDEX IF NOT EXISTS idx_manga_alternative_titles ON Manga(alternative_titles)");
        
        console.log('[Maintenance] Clean sweep and indexing completed (PG Mode).');
    } catch (e) {
        console.error('[Maintenance] Sweep failed:', e.message);
    }
}

// Helper for template literals found in some crawler versions
export function sql(strings, ...values) {
    let result = '';
    strings.forEach((str, i) => {
        result += str + (values[i] !== undefined ? values[i] : '');
    });
    return result;
}

