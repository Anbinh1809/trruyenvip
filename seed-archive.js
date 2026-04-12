import { crawlNetTruyen, crawlTruyenQQ } from './src/lib/crawler.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seedArchive(startPage = 1, endPage = 5) {
    console.log(`=== STARTING ARCHIVE SEEDING (From page ${startPage} to ${endPage}) ===`);
    
    for (let p = startPage; p <= endPage; p++) {
        console.log(`\n--- Processing Page ${p} ---`);
        
        try {
            await crawlNetTruyen(p);
            console.log(`Done NetTruyen page ${p}`);
        } catch (e) {
            console.error(`Error NetTruyen page ${p}:`, e.message);
        }

        await delay(2000); // 2s wait to avoid IP ban

        try {
            await crawlTruyenQQ(p);
            console.log(`Done TruyenQQ page ${p}`);
        } catch (e) {
            console.error(`Error TruyenQQ page ${p}:`, e.message);
        }

        await delay(2000); // 2s wait
    }

    console.log('\n=== ARCHIVE SEEDING FINISHED ===');
    process.exit(0);
}

// Get pages from args or default
const args = process.argv.slice(2);
const start = parseInt(args[0]) || 1;
const end = parseInt(args[1]) || (args[0] ? parseInt(args[0]) : 5);

seedArchive(start, end);
