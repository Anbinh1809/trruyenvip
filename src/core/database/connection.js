import pg from 'pg';
import 'dotenv/config';

if (!process.env.DATABASE_URL) throw new Error('FATAL: DATABASE_URL missing!');

let connectionString = process.env.DATABASE_URL;
if (connectionString?.includes('sslmode=') && !connectionString.includes('uselibpqcompat=true')) {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'uselibpqcompat=true';
}

const isCloudDB = ['supabase', 'neon', '.aivencloud.com'].some(d => connectionString?.includes(d));

const pool = new pg.Pool({ 
    connectionString,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 10, 
    allowExitOnIdle: true,
    ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => console.warn('[PG] Idle error:', err.message));

function mapNamedParams(sql, params = {}) {
    let count = 1;
    const values = [];
    const pMap = new Map();

    const mappedSql = sql.replace(/@(\w+)\b/g, (match, name) => {
        if (!params.hasOwnProperty(name)) return match;
        if (!pMap.has(name)) {
            pMap.set(name, count++);
            values.push(params[name]);
        }
        return `$${pMap.get(name)}`;
    });

    return { sql: mappedSql, values };
}

export async function query(sqlString, params = {}, client = null, retryCount = 0) {
    const { sql, values } = mapNamedParams(sqlString, params);
    
    try {
        const executor = client || pool;
        const res = await executor.query(sql, values);
        const rows = res.rows || [];
        return { recordset: rows, recordsets: [rows], rowsAffected: [res.rowCount || 0], rowCount: res.rowCount || 0 };
    } catch (err) {
        const msg = err.message.toLowerCase();
        const isTermination = msg.includes('terminated') || msg.includes('timeout') || msg.includes('reset') || ['ECONNRESET', '57P01', '57P03'].includes(err.code);
            
        if (isTermination && retryCount < 3 && !client) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
            return query(sqlString, params, client, retryCount + 1);
        }
        throw err;
    }
}

export async function withTransaction(callback) {
    let client, attempt = 0;
    while (attempt <= 2) {
        try {
            client = await pool.connect();
            break;
        } catch (e) {
            if (attempt === 2) throw e;
            await new Promise(r => setTimeout(r, 1000 * (++attempt)));
        }
    }

    try {
        await client.query('BEGIN');
        const res = await callback(client);
        await client.query('COMMIT');
        return res;
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        throw err;
    } finally {
        if (client) client.release();
    }
}

export async function bulkInsert(tableName, rows, client = null) {
    if (!rows?.length) return;
    
    const dbClient = client || await pool.connect();
    try {
        // TITAN SECURITY: Strict Table Allow-list
        if (!['notifications', 'chapterimages', 'crawlertasks', 'mangagenres', 'crawllogs', 'guardianreports'].includes(tableName.replace(/[\[\]"]/g, '').toLowerCase())) {
            throw new Error(`SECURITY ALERT: Non-whitelisted table: ${tableName}`);
        }

        const cols = Object.keys(rows[0]);
        const vals = [];
        const placeholders = rows.map((r, i) => `(${cols.map((_, j) => {
            vals.push(r[cols[j]]);
            return `$${i * cols.length + j + 1}`;
        }).join(', ')})`).join(', ');

        await (client || dbClient).query(`INSERT INTO ${tableName} (${cols.map(c => `"${c.toLowerCase()}"`).join(', ')}) VALUES ${placeholders} ON CONFLICT DO NOTHING`, vals);
    } finally {
        if (!client) dbClient.release();
    }
}

export const MANGA_CARD_FIELDS = `id, title, cover, last_chap_num, rating, views, views_at_source, author, status, last_crawled, normalized_title`;

export async function checkRateLimit(key, limit, windowSeconds) {
    try {
        const resetAt = new Date(Date.now() + windowSeconds * 1000);
        const res = await query(`
            INSERT INTO ratelimits (key, count, reset_at)
            VALUES (@key, 1, @resetAt)
            ON CONFLICT (key) DO UPDATE 
            SET count = CASE WHEN ratelimits.reset_at < NOW() THEN 1 ELSE ratelimits.count + 1 END,
                reset_at = CASE WHEN ratelimits.reset_at < NOW() THEN @resetAt ELSE ratelimits.reset_at END
            RETURNING count, reset_at
        `, { key, resetAt });

        const { count, reset_at } = res.recordset[0];
        return { success: count <= limit, count, limit, remaining: Math.max(0, limit - count), reset: new Date(reset_at).getTime() };
    } catch {
        return { success: true, count: 0, limit, remaining: limit, reset: Date.now() };
    }
}

export async function saveSystemState(key, value) {
    try {
        await query(`INSERT INTO system_config (key, value, updated_at) VALUES (@key, @value, NOW()) ON CONFLICT (key) DO UPDATE SET value = @value, updated_at = NOW()`, { key, value: JSON.stringify(value) });
    } catch {}
}

export async function loadSystemState(key) {
    try {
        const res = await query('SELECT value FROM system_config WHERE key = @key', { key });
        return res.recordset?.[0]?.value || null;
    } catch { return null; }
}



