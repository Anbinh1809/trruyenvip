import sql from 'mssql';
export { sql };
import 'dotenv/config';

// NUCLEAR FIX: Disable TLS certificate rejection for local/private DB connections
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
    console.warn('[DB] Safety: Disabling TLS rejection for local MSSQL connection context.');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'TruyenVip',
  options: {
    encrypt: false, // Set to false to bypass certificate issues on localhost
    trustServerCertificate: true, 
  },
  pool: {
    max: 50, // Upgraded for high-concurrency Titan-grade scraping
    min: 0,
    idleTimeoutMillis: 30000
  },
  requestTimeout: 15000 // Prevent query hangs during heavy load
};

let poolPromise = null;

export async function getDb() {
  if (!poolPromise) {
    poolPromise = sql.connect(config)
      .catch(err => {
        console.error('Database Connection Failed! Setting pool to null for retry:', err.message);
        poolPromise = null; // Allow retry on next call
        throw err;
      });
  }
  return poolPromise;
}

export async function query(sqlString, params = {}, transaction = null) {
  try {
    const pool = await getDb();
    const request = transaction ? transaction.request() : pool.request();
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        request.input(key, sql.NVarChar, value);
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            request.input(key, sql.Int, value);
        } else {
            request.input(key, sql.Float, value);
        }
      } else if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value);
      } else if (value instanceof Date) {
        request.input(key, sql.DateTime, value);
      } else {
        request.input(key, value);
      }
    }
    
    return await request.query(sqlString);
  } catch (err) {
    // SECURITY: Limit error verbosity in production
    const isProd = process.env.NODE_ENV === 'production';
    const errorPrefix = transaction ? '[TX ERROR]' : '[SQL ERROR]';
    
    console.error(`${errorPrefix} ${err.message}${!isProd ? ` \nSQL: ${sqlString.substring(0, 500)}` : ''}`);
    
    // Transparently rethrow for higher-level catchers
    throw err;
  }
}

/**
 * Execute a callback within a managed transaction.
 * @param {Function} callback - Async function that receives the transaction object: (transaction) => Promise
 */
export async function withTransaction(callback) {
    const pool = await getDb();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const result = await callback(transaction);
        await transaction.commit();
        return result;
    } catch (err) {
        try { await transaction.rollback(); } catch (e) {}
        throw err;
    }
}

/**
 * Perform a high-performance batch insert using standard SQL.
 * Bypasses brittle BCP column-type and identity issues.
 * Adaptive Batching: Automatically scales to stay under SQL Server's 2100-parameter limit.
 * @param {string} tableName - Name of the table
 * @param {Array<string>} columns - Array of column names
 * @param {Array<Object>} rows - Array of objects matching column names
 */
export async function bulkInsert(tableName, columns, rows) {
    if (!rows || rows.length === 0) return;
    
    // SQL Server limits to 2100 parameters per request. 
    // We target ~2000 to be safe and account for other overhead.
    const BATCH_SIZE = Math.floor(2000 / columns.length); 
    const pool = await getDb();

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const colNames = columns.map(c => `[${c}]`).join(', ');
        const request = pool.request();
        
        let sqlValues = [];
        batch.forEach((row, rowIndex) => {
            const rowValues = [];
            columns.forEach((col, colIndex) => {
                const paramName = `p${rowIndex}_${colIndex}`;
                request.input(paramName, row[col]);
                rowValues.push(`@${paramName}`);
            });
            sqlValues.push(`(${rowValues.join(', ')})`);
        });

        const sqlString = `INSERT INTO ${tableName} (${colNames}) VALUES ${sqlValues.join(', ')}`;
        await request.query(sqlString);
    }
}

export const MANGA_CARD_FIELDS = `id, title, cover, last_chap_num, rating, views, author, status, last_crawled`;

/**
 * Sweeps the database to replace legacy corruption artifacts.
 */
export async function cleanLegacyEncoding() {
    console.log('[Maintenance] Sweeping database for legacy corruption...');
    try {
        await query("UPDATE Manga SET last_chap_num = N'Đang cập nhật' WHERE last_chap_num = '??'");
        await query("UPDATE Manga SET author = N'Đang cập nhật' WHERE author = '??'");
        await query("UPDATE Manga SET status = N'Đang cập nhật' WHERE status = '??'");
        await query("UPDATE Chapters SET title = REPLACE(title, '??', '') WHERE title LIKE '%??%'");
        console.log('[Maintenance] Clean sweep completed.');
    } catch (e) {
        console.error('[Maintenance] Sweep failed:', e.message);
    }
}

