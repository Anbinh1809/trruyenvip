import { query } from './db.js';

/**
 * Titan Maintenance Engine
 * Designed to keep the Neon DB footprint lean and the crawler responsive.
 */
export async function runMaintenance() {
    const timestamp = new Date().toLocaleString();
    console.log(`[Maintenance][${timestamp}] Starting system-wide pruning...`);

    const results = {
        logsPurged: 0,
        reportsPurged: 0,
        tasksRecovered: 0,
        orphanImagesRemoved: 0
    };

    try {
        // 1. Prune crawllogs (Keep 24 hours of logs only to save space)
        const logRes = await query(`
            DELETE FROM crawllogs 
            WHERE created_at < NOW() - INTERVAL '1 day'
        `);
        results.logsPurged = logRes.rowCount || 0;

        // 2. Prune guardianreports (Keep 3 days)
        const reportRes = await query(`
            DELETE FROM guardianreports 
            WHERE created_at < NOW() - INTERVAL '3 days'
        `);
        results.reportsPurged = reportRes.rowCount || 0;

        // 3. Recover Orphaned Tasks (Stuck for > 1 hour)
        const taskRes = await query(`
            UPDATE crawlertasks 
            SET status = 'pending', updated_at = NOW() 
            WHERE status = 'processing' 
            AND updated_at < NOW() - INTERVAL '1 hour'
        `);
        results.tasksRecovered = taskRes.rowCount || 0;

        // 4. Clean Orphaned chapterimages (Optimized for PostgreSQL Performance)
        const orphanRes = await query(`
            DELETE FROM chapterimages ci
            WHERE NOT EXISTS (
                SELECT 1 FROM chapters c WHERE c.id = ci.chapter_id
            )
        `);
        results.orphanImagesRemoved = orphanRes.rowCount || 0;

        // 5. Optimize Indexes (VACUUM-like triggers for Neon)
        // Neon handles vacuuming automatically, but we can hit some stats routes if needed.

        console.log(`[Maintenance][${timestamp}] Complete:`, results);
        return { success: true, results };
    } catch (error) {
        console.error(`[Maintenance][${timestamp}] Failed:`, error.message);
        return { success: false, error: error.message };
    }
}
