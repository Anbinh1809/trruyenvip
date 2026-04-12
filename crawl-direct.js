// This allows running the crawler directly without HTTP
const { crawlLatest } = require('./src/lib/crawler');

async function run() {
    console.log('--- Direct Crawl Started ---');
    try {
        await crawlLatest();
        console.log('--- Direct Crawl Finished ---');
        process.exit(0);
    } catch (err) {
        console.error('--- Direct Crawl Failed ---', err.message);
        process.exit(1);
    }
}

run();
