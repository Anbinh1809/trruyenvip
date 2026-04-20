import { query } from '../src/core/database/connection.js';

const tables = await query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
console.log('=== TABLES ===');
for (const t of tables.recordset) console.log(' -', t.table_name);

const cols = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='manga' ORDER BY ordinal_position`);
console.log('\n=== manga columns ===');
for (const c of cols.recordset) console.log(` - ${c.column_name}: ${c.data_type}`);

const chap = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='chapters' ORDER BY ordinal_position`);
console.log('\n=== chapters columns ===');
for (const c of chap.recordset) console.log(` - ${c.column_name}: ${c.data_type}`);

const counts = await query(`SELECT 
  (SELECT COUNT(*) FROM manga) as manga_count,
  (SELECT COUNT(*) FROM chapters) as chapter_count,
  (SELECT COUNT(*) FROM chapterimages) as image_count,
  (SELECT COUNT(*) FROM users) as user_count,
  (SELECT COUNT(*) FROM crawlertasks WHERE status='pending') as pending_tasks,
  (SELECT COUNT(*) FROM crawlertasks WHERE status='failed') as failed_tasks
`);
console.log('\n=== COUNTS ===');
console.log(counts.recordset[0]);

const failedTasks = await query(`SELECT type, last_error, COUNT(*) as cnt FROM crawlertasks WHERE status='failed' GROUP BY type, last_error ORDER BY cnt DESC LIMIT 10`);
console.log('\n=== FAILED TASKS BREAKDOWN ===');
for (const f of failedTasks.recordset) console.log(f);

process.exit(0);
