import { query } from '../core/connection.js';

async function performPolarRecovery() {
    console.log('--- Operation Polaris: Data Recovery & Sanitization ---');
    try {
        // 1. Fix broken encoding characters (??)
        console.log('[1/4] Fixing legacy encoding errors (??)...');
        await query("UPDATE manga SET title = REPLACE(title, '??', '') WHERE title LIKE '%??%'");
        await query("UPDATE manga SET author = REPLACE(author, '??', '') WHERE author LIKE '%??%'");
        await query("UPDATE manga SET description = REPLACE(description, '??', '') WHERE description LIKE '%??%'");
        await query("UPDATE chapters SET title = REPLACE(title, '??', '') WHERE title LIKE '%??%'");
        
        // 2. Fix placeholders
        console.log('[2/4] Normalizing status and author placeholders...');
        await query("UPDATE manga SET author = 'Đang cập nhật' WHERE author IS NULL OR author = '' OR author = '??'");
        await query("UPDATE manga SET status = 'Đang tiến hành' WHERE status IS NULL OR status = '' OR status = '??'");
        await query("UPDATE manga SET last_chap_num = '0' WHERE last_chap_num = '??' OR last_chap_num IS NULL");

        // 3. Prune orphaned data
        console.log('[3/4] Pruning orphaned chapter images...');
        await query("DELETE FROM chapterimages WHERE chapter_id NOT IN (SELECT id FROM chapters)");
        
        // 4. Reset stuck tasks
        console.log('[4/4] Resetting stuck crawler tasks...');
        await query("UPDATE crawlertasks SET status = 'pending' WHERE status = 'processing' AND updated_at < NOW() - INTERVAL '30 minutes'");

        console.log('--- Data Recovery Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('--- Recovery Failed ---');
        console.error(err);
        process.exit(1);
    }
}

performPolarRecovery();

