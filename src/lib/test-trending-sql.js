import { query } from './db.js';

async function test() {
    console.log('--- [Titan SQL Tester] Testing Trending Query ---');
    try {
        const sql = `
            SELECT TOP 5 m.id, m.title, m.cover
            FROM Manga m
            JOIN Chapters c ON m.id = c.manga_id
            GROUP BY m.id, m.title, m.cover
            ORDER BY COUNT(c.id) DESC
        `;
        const result = await query(sql);
        console.log('[SUCCESS] Query executed perfectly!');
        console.log(`[DATA] Found ${result.recordset.length} items.`);
        console.log(JSON.stringify(result.recordset.slice(0, 2), null, 2));
    } catch (e) {
        console.error('[FAIL] Query exploded:', e.message);
        console.error('[STACK]', e.stack);
    }
}

test();
