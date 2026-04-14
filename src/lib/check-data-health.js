import { query } from './db.js';

async function checkHealth() {
    console.log('--- [Titan Health Monitor] Database Status ---');
    try {
        const mangaCount = await query('SELECT COUNT(*) as total FROM "manga"');
        const chapterCount = await query('SELECT COUNT(*) as total FROM "chapters"');
        const logsCount = await query('SELECT COUNT(*) as total FROM "crawllogs"');
        const crawlerTasksCount = await query('SELECT COUNT(*) as total FROM "crawlertasks"');

        console.log(`[DATA] Manga: ${mangaCount.recordset?.[0]?.total || 0}`);
        console.log(`[DATA] Chapters: ${chapterCount.recordset?.[0]?.total || 0}`);
        console.log(`[DATA] Logs: ${logsCount.recordset?.[0]?.total || 0}`);
        console.log(`[DATA] Tasks: ${crawlerTasksCount.recordset?.[0]?.total || 0}`);

        if ((chapterCount.recordset?.[0]?.total || 0) == 0) {
            console.warn('[ALERT] NO CHAPTERS FOUND! The Trending query (JOIN Chapters) will always return EMPTY!');
        }
        
    } catch (e) {
        console.error('[FAIL] Health check failed:', e.message);
    }
}

checkHealth();
