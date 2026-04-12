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

    // 2. Convert SELECT TOP n to LIMIT n (Handling nested subqueries)
    // We use a regex that matches SELECT TOP n and moves the LIMIT to after the ORDER BY or FROM
    // This is complex for a regex, so we handle the most common pattern found in this app.
    translatedSql = translatedSql.replace(/SELECT\s+TOP\s+(\d+)\s+([\s\S]+?)(?=\)|$)/gi, (match, n, content) => {
        // If it's a subquery (ends with ')'), we put LIMIT inside
        return `SELECT ${content} LIMIT ${n}`;
    });
    // Fallback for non-subqueries if the regex above didn't catch it
    if (translatedSql.includes('TOP')) {
        const topMatch = translatedSql.match(/SELECT\s+TOP\s+(\d+)/i);
        if (topMatch) {
            translatedSql = translatedSql.replace(/TOP\s+\d+\s+/i, '');
            translatedSql += ` LIMIT ${topMatch[1]}`;
        }
    }

    // 3. Convert SQL Server specific functions & identifiers
    translatedSql = translatedSql.replace(/GETDATE\(\)/gi, 'NOW()');
    translatedSql = translatedSql.replace(/ISNULL/gi, 'COALESCE');

    // 4. Convert DATEADD (e.g., DATEADD(hour, -1, GETDATE()) -> NOW() - INTERVAL '1 hour')
    // Regex matches: DATEADD(unit, amount, date)
    translatedSql = translatedSql.replace(/DATEADD\s*\(\s*(\w+)\s*,\s*(-?\s*\d+)\s*,\s*([^)]+)\)/gi, (match, unit, amount, date) => {
        const cleanAmount = amount.replace(/\s+/g, '');
        const absAmount = Math.abs(parseInt(cleanAmount));
        const sign = parseInt(cleanAmount) >= 0 ? '+' : '-';
        return `(${date} ${sign} INTERVAL '${absAmount} ${unit}')`;
    });

    // 5. Convert SQL Server specific operators (CROSS APPLY / OUTER APPLY)
    translatedSql = translatedSql.replace(/CROSS APPLY/gi, 'CROSS JOIN LATERAL');
    translatedSql = translatedSql.replace(/OUTER APPLY/gi, 'LEFT JOIN LATERAL');

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
    // Encoding issues like ?? are usually MSSQL NVarChar collation problems.
    // Postgres handles UTF-8 natively, so we just clear existing artifacts.
    try {
        await query("UPDATE Manga SET last_chap_num = 'Đang cập nhật' WHERE last_chap_num = '??'");
        await query("UPDATE Manga SET author = 'Đang cập nhật' WHERE author = '??'");
        console.log('[Maintenance] Clean sweep completed (PG Mode).');
    } catch (e) {
        console.error('[Maintenance] Sweep failed:', e.message);
    }
}

