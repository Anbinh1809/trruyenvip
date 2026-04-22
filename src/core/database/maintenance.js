import { query } from './connection.js';

/**
 * TITAN CONSOLIDATED MAINTENANCE SERVICE
 * Centralizes all data sanitization, log pruning, and resource reclamation logic.
 */

export async function rotateLogs(days = 7) {
    try {
        console.log(`[Maintenance] Pruning logs older than ${days} days...`);
        const res = await query("DELETE FROM crawllogs WHERE created_at < DATEADD(day, -@days, GETDATE())", { days });
        return { success: true, count: res.rowCount };
    } catch (e) {
        console.error('[Maintenance] rotateLogs failed:', e.message);
        return { success: false, error: e.message };
    }
}

export async function healData() {
    try {
        console.log('[Maintenance] Healing broken titles and slugs...');
        
        // Fix missing slugs
        const missing = await query("SELECT TOP(100) id, title FROM manga WHERE normalized_title IS NULL OR normalized_title = ''");
        if (missing.recordset?.length > 0) {
            for (const m of missing.recordset) {
                const slug = m.title.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd')
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                const finalSlug = slug || m.id || `unknown-${Date.now()}`;
                await query("UPDATE manga SET normalized_title = @slug WHERE id = @id", { slug: finalSlug, id: m.id });
            }
        }

        // Cleanup encoding artifacts
        await query("UPDATE manga SET description = REPLACE(description, '??', '') WHERE description LIKE '%??%'");
        await query("UPDATE manga SET title = REPLACE(title, '??', '') WHERE title LIKE '%??%'");
        
        return { success: true, healed: missing.recordset?.length || 0 };
    } catch (e) {
        console.error('[Maintenance] healData failed:', e.message);
        return { success: false, error: e.message };
    }
}

export async function purgeOrphans() {
    try {
        console.log('[Maintenance] Purging orphaned records...');
        
        // Orphaned images
        await query(`
            DELETE ci FROM chapterimages ci 
            LEFT JOIN chapters c ON ci.chapter_id = c.id
            WHERE c.id IS NULL
        `);

        // Orphaned genre links
        await query(`
            DELETE mg FROM mangagenres mg
            LEFT JOIN manga m ON mg.manga_id = m.id
            WHERE m.id IS NULL
        `);

        // Old notifications
        await query("DELETE FROM notifications WHERE is_read = 1 AND created_at < DATEADD(day, -30, GETDATE())");
        
        // Old rate limits
        await query("DELETE FROM ratelimits WHERE reset_at < GETDATE()");

        return { success: true };
    } catch (e) {
        console.error('[Maintenance] purgeOrphans failed:', e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Runs the full maintenance cycle.
 */
export async function runFullMaintenance() {
    console.log('--- [SHIELD] Starting Full System Maintenance ---');
    const logs = await rotateLogs(3);
    const data = await healData();
    const orphans = await purgeOrphans();
    console.log('--- [SHIELD] Maintenance Completed ---');
    return { logs, data, orphans };
}
