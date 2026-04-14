import { queueDiscovery } from '../lib/crawler/engine.js';

async function seed() {
    console.log('--- TITAN GENESIS: INITIATING FRESH CRAWL ---');
    
    try {
        // Queue 5 pages for intensive discovery
        await queueDiscovery('nettruyen', 5, 1, 1);
        console.log('--- SUCCESS: DISCOVERY QUEUED (5 PAGES) ---');
        process.exit(0);
    } catch (err) {
        console.error('--- FAILURE: SEEDING FAILED ---', err);
        process.exit(1);
    }
}

seed();
