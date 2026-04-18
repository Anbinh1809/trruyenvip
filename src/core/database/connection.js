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
    connectionTimeoutMillis: 30000, // Titan-grade timeout for cold starts
    idleTimeoutMillis: 30000,        // Prune stale connections
    max: 10, 
    allowExitOnIdle: true,          // Allow build process to terminate cleanly
    ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

// GLOBAL POOL ERROR HANDLER: Proactively handle idle connection losses
pool.on('error', (err) => {
    console.warn('[PG POOL WARNING] Idle client error:', err.message);
});

// Cache for translated SQL to avoid regex overhead on every query
const translationCache = new Map();
const MAX_CACHE_SIZE = 500;

/**
 * SIMPLE NAMED PARAMETER MAPPER
 * Converts @param to $1, $2... and returns the values in order.
 */
function mapNamedParams(sql, params = {}) {
    let paramCount = 1;
    const values = [];
    const keys = Object.keys(params).sort((a, b) => b.length - a.length);

    let mappedSql = sql;
    const paramMap = new Map();

    // Regex to match named params like @id, @key but not words followed by @
    const regex = /@(\w+)\b/g;

    mappedSql = mappedSql.replace(regex, (match, name) => {
        if (params.hasOwnProperty(name)) {
            if (paramMap.has(name)) {
                return `$${paramMap.get(name)}`;
            }
            const currentIdx = paramCount++;
            paramMap.set(name, currentIdx);
            values.push(params[name]);
            return `$${currentIdx}`;
        }
        return match;
    });

    return { sql: mappedSql, values };
}


/**
 * POLARIS QUERY EXECUTOR
 * Native PostgreSQL execution with named parameter support via mapNamedParams.
 */
export async function query(sqlString, params = {}, client = null, retryCount = 0) {
    const { sql: psql, values } = mapNamedParams(sqlString, params);
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
        const errMsg = err.message.toLowerCase();
        
        // Comprehensive Detection of Network/Termination/Timeout errors
        const isTerminationError = 
            errMsg.includes('terminated') || 
            errMsg.includes('timeout') || 
            errMsg.includes('reset') ||
            err.code === 'ECONNRESET' || 
            err.code === '57P01' || 
            err.code === '57P03';
            
        if (isTerminationError && retryCount < MAX_RETRIES && !client) {
            const delay = 1000 * Math.pow(2, retryCount); 
            console.warn(`[PG RETRY ${retryCount + 1}/${MAX_RETRIES}] Reason: ${err.message}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return query(sqlString, params, client, retryCount + 1);
        }

        console.error(`[PG ERROR] ${err.message} \nSQL: ${psql.substring(0, 300)}`);
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
    // TITAN SECURITY: Strict Table Allow-list for Bulk Operations
    const tableWhitelist = ['notifications', 'chapterimages', 'crawlertasks', 'mangagenres', 'crawllogs', 'guardianreports'];
    const cleanTable = tableName.replace(/[\[\]"]/g, '').toLowerCase();
    
    if (!tableWhitelist.includes(cleanTable)) {
        throw new Error(`SECURITY ALERT: Bulk insert attempted on non-whitelisted table: ${cleanTable}`);
    }


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

export const MANGA_CARD_FIELDS = `id, title, cover, last_chap_num, rating, views, views_at_source, author, status, last_crawled, normalized_title`;

// Consolidated Maintenance logic moved to src/core/database/maintenance.js


/**
 * TITAN RATE LIMITER
 * Persistently tracks requests per key (IP, User ID, etc.)
 */
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
        const isAllowed = count <= limit;

        return {
            success: isAllowed,
            count,
            limit,
            remaining: Math.max(0, limit - count),
            reset: new Date(reset_at).getTime()
        };
    } catch (e) {
        console.error('[TITAN SECURITY] Rate limit check failed:', e.message);
        return { success: true, count: 0, limit, remaining: limit, reset: Date.now() };
    }
}

// --- SYSTEM CONFIGURATION HELPERS ---

/**
 * Persists a system configuration key-value pair to the database.
 * Useful for crawler state, global toggles, and maintenance timestamps.
 */
export async function saveSystemState(key, value) {
    try {
        await query(`
            INSERT INTO system_config (key, value, updated_at)
            VALUES (@key, @value, NOW())
            ON CONFLICT (key) DO UPDATE SET value = @value, updated_at = NOW()
        `, { key, value: JSON.stringify(value) });
    } catch (e) {
        console.error(`[DB] Failed to save system state [${key}]:`, e.message);
    }
}

/**
 * Loads a system configuration value from the database.
 */
export async function loadSystemState(key) {
    try {
        const res = await query('SELECT value FROM system_config WHERE key = @key', { key });
        return res.recordset?.[0]?.value || null;
    } catch (e) {
        console.error(`[DB] Failed to load system state [${key}]:`, e.message);
        return null;
    }
}

/**
 * Periodically run the automated maintenance service.
 */
/**
 * Periodically run the automated maintenance service.
 * DISABLED: Manually triggered via script only for stability.
 */
// if (typeof setInterval !== 'undefined') {
//     setInterval(cleanLegacyEncoding, 1000 * 60 * 60 * 5); 
// }



