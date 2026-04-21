import sql from 'mssql';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'Server=localhost;Database=truyenvip;User Id=sa;Password=123456;TrustServerCertificate=true;';

const pool = new sql.ConnectionPool(connectionString);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.warn('[SQL] Pool error:', err);
});

export async function query(sqlString, params = {}, client = null, retryCount = 0) {
    await poolConnect;
    
    try {
        const executor = client ? client : pool.request();
        
        let req = executor;
        if (!client || !client._isTransactionRequest) {
            // If it's the raw pool request or we just created it
            for (const [key, value] of Object.entries(params)) {
                req.input(key, value);
            }
        } else {
             // For transaction requests, we need a fresh request per query so parameters do not conflict
             req = new sql.Request(client.transaction);
             for (const [key, value] of Object.entries(params)) {
                 req.input(key, value);
             }
        }

        const res = await req.query(sqlString);
        return { 
            recordset: res.recordset || [], 
            recordsets: res.recordsets || [res.recordset || []], 
            rowsAffected: res.rowsAffected || [0], 
            rowCount: res.rowsAffected?.[0] || 0 
        };
    } catch (err) {
        if (retryCount < 3 && err.name === 'ConnectionError' && !client) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
            return query(sqlString, params, client, retryCount + 1);
        }
        throw err;
    }
}

export async function withTransaction(callback) {
    await poolConnect;
    const transaction = new sql.Transaction(pool);
    
    let attempt = 0;
    while (attempt <= 2) {
        try {
            await transaction.begin();
            break;
        } catch (e) {
            if (attempt === 2) throw e;
            await new Promise(r => setTimeout(r, 1000 * (++attempt)));
        }
    }

    try {
        // Pass a mock client that uses this transaction
        const client = {
            transaction: transaction,
            _isTransactionRequest: true,
            query: async (sqlString, params = {}) => {
                const req = new sql.Request(transaction);
                for (const [key, value] of Object.entries(params)) {
                    req.input(key, value);
                }
                const res = await req.query(sqlString);
                return { 
                    recordset: res.recordset || [], 
                    rowCount: res.rowsAffected?.[0] || 0 
                };
            }
        };

        const res = await callback(client);
        await transaction.commit();
        return res;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

export async function bulkInsert(tableName, rows, client = null) {
    if (!rows?.length) return;
    
    await poolConnect;
    // TITAN SECURITY: Strict Table Allow-list
    const allowedTables = ['notifications', 'chapterimages', 'crawlertasks', 'mangagenres', 'crawllogs', 'guardianreports'];
    if (!allowedTables.includes(tableName.replace(/[\[\]"]/g, '').toLowerCase())) {
        throw new Error(`SECURITY ALERT: Non-whitelisted table: ${tableName}`);
    }

    const cols = Object.keys(rows[0]);
    if (!cols.every(c => /^[a-zA-Z_0-9]+$/.test(c))) {
        throw new Error(`SECURITY ALERT: Invalid column names in bulkInsert`);
    }

    const transaction = client?.transaction || new sql.Transaction(pool);
    if (!client) await transaction.begin();

    try {
        // T-SQL doesn't support ON CONFLICT DO NOTHING natively in INSERT.
        // For allowed tables (logs, reports), we can just catch duplicate warnings,
        // or use MERGE for specific tables if there are unique constraints.
        // Alternatively, bulk insert via table-valued parameters or batch processing.
        // A simple batch insert approach since data size is small:
        
        for (const row of rows) {
            try {
                const req = new sql.Request(transaction);
                for (let i = 0; i < cols.length; i++) {
                    req.input(`param${i}`, row[cols[i]]);
                }
                const placeholders = cols.map((_, i) => `@param${i}`).join(', ');
                const colsFormatted = cols.map(c => `[${c}]`).join(', ');
                await req.query(`BEGIN TRY INSERT INTO [${tableName}] (${colsFormatted}) VALUES (${placeholders}) END TRY BEGIN CATCH END CATCH`);
            } catch (ignore) { }
        }
        
        if (!client) await transaction.commit();
    } catch (err) {
        if (!client) await transaction.rollback();
        throw err;
    }
}

export const MANGA_CARD_FIELDS = `id, title, cover, last_chap_num, rating, views, views_at_source, author, status, last_crawled, normalized_title`;

export async function checkRateLimit(key, limit, windowSeconds) {
    try {
        const resetAt = new Date(Date.now() + windowSeconds * 1000);
        const res = await query(`
            MERGE ratelimits AS target
            USING (SELECT @key AS keycol) AS source
            ON target.[key] = source.keycol
            WHEN MATCHED THEN
                UPDATE SET 
                    count = CASE WHEN target.reset_at < GETDATE() THEN 1 ELSE target.count + 1 END,
                    reset_at = CASE WHEN target.reset_at < GETDATE() THEN @resetAt ELSE target.reset_at END
            WHEN NOT MATCHED THEN
                INSERT ([key], count, reset_at) VALUES (@key, 1, @resetAt)
            OUTPUT inserted.count, inserted.reset_at;
        `, { key, resetAt });

        const count = res.recordset[0].count;
        const reset_at = res.recordset[0].reset_at;
        return { success: count <= limit, count, limit, remaining: Math.max(0, limit - count), reset: new Date(reset_at).getTime() };
    } catch (err) {
        return { success: true, count: 0, limit, remaining: limit, reset: Date.now() };
    }
}

export async function saveSystemState(key, value) {
    try {
        await query(`
            MERGE system_config AS target
            USING (SELECT @key AS keycol) AS source
            ON target.[key] = source.keycol
            WHEN MATCHED THEN UPDATE SET value = @value, updated_at = GETDATE()
            WHEN NOT MATCHED THEN INSERT ([key], value, updated_at) VALUES (@key, @value, GETDATE());
        `, { key, value: JSON.stringify(value) });
    } catch {}
}

export async function loadSystemState(key) {
    try {
        const res = await query('SELECT value FROM system_config WHERE [key] = @key', { key });
        const val = res.recordset?.[0]?.value;
        return val ? JSON.parse(val) : null;
    } catch { return null; }
}



