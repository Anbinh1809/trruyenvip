import { query } from './connection.js';

/**
 * TITAN CONSOLIDATED MAINTENANCE SERVICE
 * Centralizes all data sanitization, log pruning, and resource reclamation logic.
 */

export async function rotateLogs(days = 7) {
    try {
        console.log(`[Maintenance] Pruning logs older than ${days} days...`);
        const res = await query("DELETE FROM crawllogs WHERE created_at < NOW() - INTERVAL '1 day' * @days", { days });
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
        const missing = await query("SELECT id, title FROM manga WHERE normalized_title IS NULL OR normalized_title = '' LIMIT 100");
        if (missing.recordset?.length > 0) {
            for (const m of missing.recordset) {
                const slug = m.title.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd')
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                await query("UPDATE manga SET normalized_title = @slug WHERE id = @id", { slug, id: m.id });
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
            DELETE FROM chapterimages 
            WHERE chapter_id NOT IN (SELECT id FROM chapters)
        `);

        // Orphaned genre links
        await query(`
            DELETE FROM mangagenres 
            WHERE manga_id NOT IN (SELECT id FROM manga)
        `);

        // Old notifications
        await query("DELETE FROM notifications WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '30 days'");
        
        // Old rate limits
        await query("DELETE FROM ratelimits WHERE reset_at < NOW()");

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
