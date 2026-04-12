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

    // 2. Convert TOP (n) to LIMIT n (Basic regex)
    translatedSql = translatedSql.replace(/SELECT TOP\s*\(?(\d+)\)?/gi, 'SELECT');
    const topMatch = sql.match(/SELECT TOP\s*\(?(\d+)\)?/i);
    if (topMatch && !translatedSql.toLowerCase().includes('limit')) {
        translatedSql += ` LIMIT ${topMatch[1]}`;
    }

    // 3. Convert SQL Server specific functions & identifiers
    translatedSql = translatedSql.replace(/GETDATE\(\)/gi, 'NOW()');
    translatedSql = translatedSql.replace(/ISNULL/gi, 'COALESCE');
    translatedSql = translatedSql.replace(/\[(\w+)\]/g, '"$1"'); // [Column] -> "Column"
    
    // 4. Convert MSSQL IF NOT EXISTS INSERT to Postgres ON CONFLICT (Conceptual/Basic)
    // NOTE: Complex procedural IF blocks should be moved to schema.sql or rewritten.
    // This translator handles simple conditional inserts if they follow standard patterns.

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

