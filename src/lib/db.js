import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';

// TITAN-GRADE POSTGRESQL POOL
// Native support for Neon.tech and Vercel Edge performance requirements.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon/Vercel
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

/**
 * TITAN QUERY TRANSLATOR
 * Automatically adapts MSSQL syntax to PostgreSQL at runtime.
 * Supports: @params -> $n, TOP -> LIMIT, GETDATE() -> NOW(), [col] -> "col"
 */
function translateSql(sql, params) {
    let translatedSql = sql;
    const values = [];
    let paramCount = 1;

    // 1. Convert @paramName to $1, $2, ...
    if (params && Object.keys(params).length > 0) {
        // Sort keys by length descending to prevent partial replacements (e.g. @id before @id_long)
        const keys = Object.keys(params).sort((a, b) => b.length - a.length);
        
        for (const key of keys) {
            const regex = new RegExp(`@${key}\\b`, 'g');
            if (translatedSql.includes(`@${key}`)) {
                translatedSql = translatedSql.replace(regex, `$${paramCount}`);
                values.push(params[key]);
                paramCount++;
            }
        }
    }

    // 2. Convert SELECT TOP n to LIMIT n
    if (translatedSql.toUpperCase().includes('TOP ')) {
        const topMatch = translatedSql.match(/TOP\s+(\d+)/i);
        if (topMatch) {
            const limitValue = topMatch[1];
            // Remove TOP n from the start
            translatedSql = translatedSql.replace(/TOP\s+\d+\s+/i, '');
            // Append LIMIT n if not already present
            if (!translatedSql.toUpperCase().includes('LIMIT ')) {
                translatedSql = translatedSql.trim() + ` LIMIT ${limitValue}`;
            }
        }
    }

    // 3. Convert SQL Server specific functions & identifiers
    translatedSql = translatedSql.replace(/GETDATE\(\)/gi, 'NOW()');
    translatedSql = translatedSql.replace(/ISNULL/gi, 'COALESCE');
    translatedSql = translatedSql.replace(/LEN\s*\(/gi, 'LENGTH(');
    
    // Convert CHARINDEX(sub, str) -> STRPOS(str, sub)
    translatedSql = translatedSql.replace(/CHARINDEX\(([^,]+),\s*([^)]+)\)/gi, 'STRPOS($2, $1)');

    // 4. Convert DATEADD (e.g., DATEADD(hour, -1, GETDATE()) -> NOW() - INTERVAL '1 hour')
    // Regex matches: DATEADD(unit, amount, date)
    translatedSql = translatedSql.replace(/DATEADD\s*\(\s*(\w+)\s*,\s*(-?\s*\d+)\s*,\s*([^)]+)\)/gi, (match, unit, amount, date) => {
        const cleanAmount = amount.replace(/\s+/g, '');
        const absAmount = Math.abs(parseInt(cleanAmount));
        const sign = parseInt(cleanAmount) >= 0 ? '+' : '-';
        // Normalize unit (SQL Server uses 'second', 'hour', etc. - Postgres prefers standard plural)
        const pgUnit = unit.toLowerCase();
        return `(${date} ${sign} INTERVAL '${absAmount} ${pgUnit}')`;
    });

    // 5. Convert SQL Server specific operators (CROSS APPLY / OUTER APPLY / OUTPUT)
    translatedSql = translatedSql.replace(/CROSS APPLY/gi, 'CROSS JOIN LATERAL');
    translatedSql = translatedSql.replace(/OUTER APPLY/gi, 'LEFT JOIN LATERAL');
    // Convert OUTPUT inserted.col -> RETURNING col
    translatedSql = translatedSql.replace(/OUTPUT\s+inserted\.(\w+)/gi, 'RETURNING $1');
    translatedSql = translatedSql.replace(/OUTPUT\s+inserted\.\*/gi, 'RETURNING *');

    // 6. Clean schema prefixes and case-sensitivity
    translatedSql = translatedSql.replace(/dbo\./gi, ''); // Remove dbo. prefix
    translatedSql = translatedSql.replace(/\[(\w+)\]/g, '$1'); 
    
    // 7. Fix calculateRank call specifically if found
    translatedSql = translatedSql.replace(/calculateRank\(([^)]+)\)/gi, 'calculate_rank($1)');

    return { sql: translatedSql, values };
}

export async function query(sqlString, params = {}) {
    const { sql: psql, values } = translateSql(sqlString, params);
    
    try {
        const result = await pool.query(psql, values);
        
        // Emulate mssql .recordset for backward compatibility
        return {
            recordset: result.rows,
            rowsAffected: [result.rowCount],
            rowCount: result.rowCount
        };
    } catch (err) {
        const isProd = process.env.NODE_ENV === 'production';
        console.error(`[PG ERROR] ${err.message}${!isProd ? ` \nOriginal SQL: ${sqlString.substring(0, 200)} \nTranslated: ${psql.substring(0, 200)}` : ''}`);
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
        const colNames = columns.map(c => `"${c}"`).join(', ');
        const valuePlaceholders = [];
        const flatValues = [];
        
        rows.forEach((row, rowIndex) => {
            const rowPlaceholders = [];
            columns.forEach((col) => {
                flatValues.push(row[col]);
                rowPlaceholders.push(`$${flatValues.length}`);
            });
            valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
        });

        const sql = `INSERT INTO "${tableName}" (${colNames}) VALUES ${valuePlaceholders.join(', ')} ON CONFLICT DO NOTHING`;
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
        console.log('[Maintenance] Clean sweep completed (PG Mode).');
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

