const { query } = require('./src/lib/db');

async function test() {
    try {
        const res = await query("SELECT TOP 5 image_url FROM ChapterImages");
        console.log('Sample Image URLs:');
        console.log(JSON.stringify(res.recordset, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('DB Error:', err.message);
        process.exit(1);
    }
}

test();
