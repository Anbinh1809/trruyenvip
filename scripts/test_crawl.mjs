import { fetchWithRetry, crawlLatest } from '../src/core/crawler/index.js';

console.log('=== LIVE MIRROR TEST ===');
try {
    const resp = await fetchWithRetry('https://nettruyenww.com/', { isDiscovery: true });
    const preview = resp.data.substring(0, 200);
    const hasItems = resp.data.includes('class="items"') || resp.data.includes('item-');
    console.log('Mirror fetch OK, HTML length:', resp.data.length);
    console.log('Has manga items:', hasItems);
    
    console.log('\n=== RUNNING crawlLatest (2 pages, nettruyen) ===');
    const found = await crawlLatest('nettruyen', 2, 1);
    console.log('New manga found:', found);
} catch (e) {
    console.error('FAILED:', e.message);
    console.error('Stack:', e.stack?.split('\n').slice(0, 5).join('\n'));
}

try {
    const resp2 = await fetchWithRetry('https://truyenqqq.com/', { isDiscovery: true });
    console.log('\nTruyenQQ OK, HTML length:', resp2.data.length);
    const found2 = await crawlLatest('truyenqq', 2, 1);
    console.log('TruyenQQ new manga found:', found2);
} catch (e2) {
    console.error('TruyenQQ FAILED:', e2.message);
}

process.exit(0);
