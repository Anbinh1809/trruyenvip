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
    // Refined to avoid replacing inside string literals
    if (params && Object.keys(params).length > 0) {
        const keys = Object.keys(params).sort((a, b) => b.length - a.length);
        
        // Match string literals OR named parameters
        // Group 1: string literal, Group 2: parameter name
        const masterRegex = /('[^']*')|@(\w+)\b/g;
        
        translatedSql = translatedSql.replace(masterRegex, (match, literal, pName) => {
            if (literal) return literal; // Return string literal unchanged
            
            const key = pName;
            if (params.hasOwnProperty(key)) {
                // If this is a new parameter we haven't mapped yet in this pass
                // We need to keep track of the index for $n
                // Note: The loop below is slightly inefficient but safe for the "Titan" scale
                const existingIndex = paramOrder.indexOf(key);
                if (existingIndex !== -1) {
                    return `$${existingIndex + 1}`;
                } else {
                    values.push(params[key]);
                    paramOrder.push(key);
                    const idx = paramCount++;
                    return `$${idx}`;
                }
            }
            return match; // Not a known param, return as is (e.g. email address handle)
        });
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
    // NOTE: Removed forceful lowercase of quoted identifiers to support CamelCase aliases needed for stats

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
            const delay = 1000 * Math.pow(2, retryCount); // Slightly longer delay for advanced hardening
            console.warn(`[PG RETRY ${retryCount + 1}/${MAX_RETRIES}] Reason: ${err.message}. Retrying in ${delay}ms...`);
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

export const MANGA_CARD_FIELDS = `id, title, cover, last_chap_num, rating, views, author, status, last_crawled, normalized_title`;

export async function cleanLegacyEncoding() {
    try {
        console.log('[DB_MAINTENANCE] Starting Titan Sanitization Cycle...');

        // 0. SCHEMA HARDENING (PostgreSQL Optimization)
        await query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        await query('CREATE INDEX IF NOT EXISTS idx_manga_normalized_title ON manga (normalized_title)');
        await query('CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters (manga_id)');
        await query('CREATE INDEX IF NOT EXISTS idx_readhistory_uuid ON readhistory (user_uuid)');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_stats_update TIMESTAMP WITH TIME ZONE');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS mission_data JSONB');
        await query("UPDATE manga SET last_chap_num = 'Đang cập nhật' WHERE last_chap_num = '??'");
        await query("UPDATE manga SET author = 'Đang cập nhật' WHERE author = '??'");
        await query("UPDATE manga SET description = REPLACE(description, '??', '') WHERE description LIKE '%??%'");
        await query("UPDATE manga SET title = REPLACE(title, '??', '') WHERE title LIKE '%??%'");
        
        // CHAPTERS TABLE HARDENING
        await query("ALTER TABLE chapters ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'");

        // TITAN-SLUG RECONSTRUCTION: Move to JS for robust transliteration
        const rawManga = await query("SELECT id, title FROM manga WHERE normalized_title IS NULL OR normalized_title = '' LIMIT 500");
        const list = rawManga.recordset || [];
        
        if (list.length > 0) {
            console.log(`[DB_MAINTENANCE] Migrating ${list.length} slugs...`);
            for (const m of list) {
                // Simple robust slugifier
                const slug = m.title.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd')
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                
                await query("UPDATE manga SET normalized_title = @slug WHERE id = @id", { slug, id: m.id });
            }
        }
        
        // 2. CHAPTERS TABLE SANITIZATION
        // Note: content might be large, we use a targeted update to avoid locking
        await query("UPDATE chapters SET title = REPLACE(title, '??', '') WHERE title LIKE '%??%'");
        
        // 3. AUTOMATED LOG & RESOURCE PRUNING (Maintain high performance)
        await query("DELETE FROM crawllogs WHERE created_at < NOW() - INTERVAL '3 days'");
        await query("DELETE FROM guardianreports WHERE created_at < NOW() - INTERVAL '7 days'");
        
        // Use more resilient DELETE with existence checks for optional tables
        try {
            await query("DELETE FROM notifications WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '30 days'");
        } catch (e) { /* ignore if table missing */ }
        
        await query("DELETE FROM readhistory WHERE updated_at < NOW() - INTERVAL '30 days'");
        await query("DELETE FROM ratelimits WHERE reset_at < NOW()");

        // 4. TASK RECOVERY: Reset tasks stuck in 'processing' for > 1 hour
        await query(`
            UPDATE crawlertasks 
            SET status = 'pending', updated_at = NOW() 
            WHERE status = 'processing' 
            AND updated_at < NOW() - INTERVAL '1 hour'
        `);

        // 5. ORPHANED IMAGE PURGE: Remove images for chapters that no longer exist
        await query(`
            DELETE FROM chapterimages 
            WHERE chapter_id NOT IN (SELECT id FROM chapters)
        `);

        await query(`
            DELETE FROM mangagenres 
            WHERE manga_id NOT IN (SELECT id FROM manga)
        `);

        // 5. INDEX HARDENING
        await query("CREATE INDEX IF NOT EXISTS idx_manga_normalized_title_gin ON manga USING gin(normalized_title gin_trgm_ops)");
        await query("CREATE INDEX IF NOT EXISTS idx_manga_alternative_titles_gin ON manga USING gin(alternative_titles gin_trgm_ops)");
        
        console.log('[TITAN INFO] Project SANITIZED: Log pruning and orphaned record cleanup completed.');
    } catch (e) {
        console.error('[TITAN ERROR] Project Sanitation failed:', e.message);
    }
}

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
if (typeof setInterval !== 'undefined') {
    setInterval(cleanLegacyEncoding, 1000 * 60 * 60 * 5); // Every 5 hours - User requested
}


