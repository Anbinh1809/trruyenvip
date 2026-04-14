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
    connectionTimeoutMillis: 15000, // Increased for serverless cold-starts
    idleTimeoutMillis: 30000,        // Prune stale connections
    max: 10, 
    allowExitOnIdle: true,          // Allow build process to terminate cleanly
    ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

// Cache for translated SQL to avoid regex overhead on every query
const translationCache = new Map();
const MAX_CACHE_SIZE = 500;

/**
 * TITAN QUERY TRANSLATOR
 * Automatically adapts MSSQL syntax to PostgreSQL at runtime.
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

    // 2. String Concatenation Fix
    translatedSql = translatedSql.replace(/(\$\d+|'[^']*')\s*\+\s*(\$\d+|'[^']*')/gi, '$1 || $2');

    // 3. TOP to LIMIT
    translatedSql = translatedSql.replace(/(SELECT\s+(?:DISTINCT\s+)?TOP\s+\(?(\d+|\$\d+)\)?)(.*?)(?=;|$)/gis, (match, prefix, limit, rest) => {
        const selectStmt = prefix.toUpperCase().includes('DISTINCT') ? 'SELECT DISTINCT' : 'SELECT';
        if (/\bLIMIT\b/i.test(rest)) return match;
        return `${selectStmt}${rest} LIMIT ${limit}`;
    });

    // 4. Common Functions
    translatedSql = translatedSql.replace(/LIKE\s+N'/gi, "LIKE '");
    translatedSql = translatedSql.replace(/GETDATE\(\)/gi, 'NOW()');
    translatedSql = translatedSql.replace(/ISNULL/gi, 'COALESCE');
    translatedSql = translatedSql.replace(/LEN\s*\(/gi, 'LENGTH(');
    translatedSql = translatedSql.replace(/CHARINDEX\(([^,]+),\s*([^)]+)\)/gi, 'STRPOS($2, $1)');

    // 5. DATEADD
    translatedSql = translatedSql.replace(/DATEADD\s*\(\s*(\w+)\s*,\s*(-?\s*(?:\d+|\$\d+|@\w+))\s*,\s*([^)]+)\)/gi, (match, unit, amount, date) => {
        const isParam = amount.includes('$') || amount.includes('@');
        if (isParam) return `(${date} + (${amount} * INTERVAL '1 ${unit}'))`;
        const cleanAmount = amount.replace(/\s+/g, '');
        const absAmount = Math.abs(parseInt(cleanAmount));
        const sign = parseInt(cleanAmount) >= 0 ? '+' : '-';
        return `(${date} ${sign} INTERVAL '${absAmount} ${unit}')`;
    });

    // 6. Operators
    translatedSql = translatedSql.replace(/CROSS APPLY/gi, 'CROSS JOIN LATERAL');
    translatedSql = translatedSql.replace(/OUTER APPLY/gi, 'LEFT JOIN LATERAL');
    translatedSql = translatedSql.replace(/OUTPUT\s+inserted\.(\w+)/gi, 'RETURNING $1');
    translatedSql = translatedSql.replace(/OUTPUT\s+inserted\.\*/gi, 'RETURNING *');

    // 7. Schema & Identifier Cleanup
    translatedSql = translatedSql.replace(/(?:\[dbo\]|"dbo"|dbo)\./gi, ''); 
    translatedSql = translatedSql.replace(/\[([^\]]+)\]/g, (match, p1) => `"${p1.toLowerCase()}"`);
    translatedSql = translatedSql.replace(/"([^"]+)"/g, (match, p1) => `"${p1.toLowerCase()}"`);

    if (translationCache.size < MAX_CACHE_SIZE) {
        translationCache.set(sql, { translatedSql, paramOrder });
    }

    return { sql: translatedSql, values };
}

/**
 * TITAN QUERY EXECUTOR with Self-Healing Retries
 */
export async function query(sqlString, params = {}, client = null, retryCount = 0) {
    const { sql: psql, values } = translateSql(sqlString, params);
    const MAX_RETRIES = 3;
    
    try {
        const executor = client || pool;
        const result = await executor.query(psql, values);
        
        const rows = result.rows || [];
        return {
            recordset: rows,
            recordsets: [rows],
            rowsAffected: [result.rowCount || 0],
            rowCount: result.rowCount || 0
        };
    } catch (err) {
        // Connection Termination / Timeout Error Codes
        const isTerminationError = 
            err.message.includes('Connection terminated') || 
            err.code === 'ECONNRESET' || 
            err.code === '57P01' || // admin_shutdown
            err.code === '57P03';   // cannot_connect_now
            
        if (isTerminationError && retryCount < MAX_RETRIES && !client) {
            const delay = 500 * Math.pow(2, retryCount);
            console.warn(`[PG RETRY ${retryCount + 1}/${MAX_RETRIES}] Connection lost. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return query(sqlString, params, client, retryCount + 1);
        }

        console.error(`[PG ERROR] ${err.message} \nOriginal SQL: ${sqlString.substring(0, 300)} \nTranslated: ${psql.substring(0, 300)}`);
        throw err;
    }
}

/**
 * Managed Transaction for PostgreSQL
 */
export async function withTransaction(callback) {
    let client;
    const MAX_CONN_RETRIES = 2;
    let connAttempt = 0;

    // Wrap connection logic to handle initial cold starts
    while (connAttempt <= MAX_CONN_RETRIES) {
        try {
            client = await pool.connect();
            break;
        } catch (e) {
            if (connAttempt === MAX_CONN_RETRIES) throw e;
            connAttempt++;
            await new Promise(r => setTimeout(r, 1000 * connAttempt));
        }
    }

    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        throw err;
    } finally {
        if (client) client.release();
    }
}

 /**
 * Titan bulkInsert optimized for PostgreSQL
 * Added support for transaction client passed from withTransaction
 */
export async function bulkInsert(tableName, rows, client = null) {
    if (!rows || rows.length === 0) return;
    
    // Extract columns from the first row
    const columns = Object.keys(rows[0]);
    const dbClient = client || await pool.connect();
    try {
        // Force lowercase and unquote table/column names to avoid case-sensitivity issues in PG
        const cleanTable = tableName.replace(/[\[\]"]/g, '').toLowerCase();
        const colNames = columns.map(c => `"${c.toLowerCase()}"`).join(', ');
        
        const flatValues = [];
        const placeholders = rows.map((_, i) => 
            `(${columns.map((_, j) => {
                flatValues.push(rows[i][columns[j]]);
                return `$${i * columns.length + j + 1}`;
            }).join(', ')})`
        ).join(', ');

        const sql = `INSERT INTO ${cleanTable} (${colNames}) VALUES ${placeholders} ON CONFLICT DO NOTHING`;
        
        if (client) {
            await client.query(sql, flatValues);
        } else {
            await dbClient.query(sql, flatValues);
        }
    } finally {
        if (!client) dbClient.release();
    }
}

export const MANGA_CARD_FIELDS = `id, title, cover, last_chap_num, rating, views, author, status, last_crawled`;

export async function cleanLegacyEncoding() {
    try {
        console.log('[Maintenance] Starting automated project sanitation (PostgreSQL)...');

        // 1. DATA SANITIZATION
        await query("UPDATE manga SET last_chap_num = 'Đang cập nhật' WHERE last_chap_num = '??'");
        await query("UPDATE manga SET author = 'Đang cập nhật' WHERE author = '??'");
        
        // 2. AUTOMATED LOG PRUNING (Maintain high-performance for 30 days, purge history)
        await query("DELETE FROM crawllogs WHERE created_at < NOW() - INTERVAL '30 days'");
        await query("DELETE FROM guardianreports WHERE created_at < NOW() - INTERVAL '30 days'");
        
        // 3. INDEX HARDENING: Ensure GIN indexes exist for fast prefix and fuzzy searches
        await query("CREATE INDEX IF NOT EXISTS idx_manga_normalized_title_gin ON manga USING gin(normalized_title gin_trgm_ops)");
        await query("CREATE INDEX IF NOT EXISTS idx_manga_alternative_titles_gin ON manga USING gin(alternative_titles gin_trgm_ops)");
        
        console.log('[Maintenance] Project SANITIZED: Log pruning/indexing completed.');
    } catch (e) {
        console.error('[Maintenance] Project Sanitation failed:', e.message);
    }
}


