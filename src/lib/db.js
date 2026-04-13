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

    // 1. Robust Named Param Mapping (@param -> $n)
    if (params && Object.keys(params).length > 0) {
        const keys = Object.keys(params).sort((a, b) => b.length - a.length);
        
        for (const key of keys) {
            const regex = new RegExp(`@${key}\\b`, 'gi');
            if (translatedSql.match(regex)) {
                translatedSql = translatedSql.replace(regex, `$${paramCount}`);
                values.push(params[key]);
                paramCount++;
            }
        }
    }

    // 2. String Concatenation Fix (MSSQL + to Postgres ||)
    // Converts $1 + '%' OR '%' + $1 OR 'A' + 'B'
    translatedSql = translatedSql.replace(/(\$\d+|'[^']*')\s*\+\s*(\$\d+|'[^']*')/gi, '$1 || $2');
    // Handle double concatenation like $1 + ' ' + $2
    translatedSql = translatedSql.replace(/(\$\d+|'[^']*')\s*\+\s*(\$\d+|'[^']*')/gi, '$1 || $2');

    // 3. Robust TOP to LIMIT translation
    // Handles SELECT TOP 10 ... and SELECT TOP @limit ...
    const topMatch = translatedSql.match(/SELECT\s+TOP\s+\(?(\d+|\$\d+)\)?/i);
    if (topMatch) {
        const limitValue = topMatch[1];
        translatedSql = translatedSql.replace(/SELECT\s+TOP\s+\(?(\d+|\$\d+)\)?/i, 'SELECT');
        // Simple append if no LIMIT exists
        if (!translatedSql.toUpperCase().includes('LIMIT ')) {
            translatedSql = translatedSql.trim();
            if (translatedSql.endsWith(';')) translatedSql = translatedSql.slice(0, -1);
            translatedSql += ` LIMIT ${limitValue}`;
        }
    }

    // 4. Common Function Mapping
    translatedSql = translatedSql.replace(/GETDATE\(\)/gi, 'NOW()');
    translatedSql = translatedSql.replace(/ISNULL/gi, 'COALESCE');
    translatedSql = translatedSql.replace(/LEN\s*\(/gi, 'LENGTH(');
    translatedSql = translatedSql.replace(/CHARINDEX\(([^,]+),\s*([^)]+)\)/gi, 'STRPOS($2, $1)');

    // 5. Convert DATEADD (e.g., DATEADD(hour, -1, GETDATE()) -> NOW() - INTERVAL '1 hour')
    translatedSql = translatedSql.replace(/DATEADD\s*\(\s*(\w+)\s*,\s*(-?\s*\d+)\s*,\s*([^)]+)\)/gi, (match, unit, amount, date) => {
        const cleanAmount = amount.replace(/\s+/g, '');
        const absAmount = Math.abs(parseInt(cleanAmount));
        const sign = parseInt(cleanAmount) >= 0 ? '+' : '-';
        const pgUnit = unit.toLowerCase();
        return `(${date} ${sign} INTERVAL '${absAmount} ${pgUnit}')`;
    });

    // 6. Convert SQL Server specific operators (CROSS APPLY / OUTER APPLY / OUTPUT)
    translatedSql = translatedSql.replace(/CROSS APPLY/gi, 'CROSS JOIN LATERAL');
    translatedSql = translatedSql.replace(/OUTER APPLY/gi, 'LEFT JOIN LATERAL');
    translatedSql = translatedSql.replace(/OUTPUT\s+inserted\.(\w+)/gi, 'RETURNING $1');
    translatedSql = translatedSql.replace(/OUTPUT\s+inserted\.\*/gi, 'RETURNING *');

    // 7. Schema & Identifier Cleanup
    translatedSql = translatedSql.replace(/dbo\./gi, ''); 
    translatedSql = translatedSql.replace(/\[(\w+)\]/g, '"$1"'); 
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

