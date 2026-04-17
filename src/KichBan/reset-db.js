import { query } from '../HeThong/CoSoDuLieu.js';

async function hardReset() {
    console.log('--- TITAN NIRVANA: INITIATING DATABASE RESET ---');
    
    const tables = [
        'chapterimages',
        'chapters',
        'mangagenres',
        'favorites',
        'readhistory',
        'manga',
        'crawlertasks',
        'crawllogs',
        'guardianreports',
        'dailycheckins',
        'redemptionrequests',
        'comments'
    ];

    try {
        const truncateSql = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`;
        console.log('Executing:', truncateSql);
        
        await query(truncateSql);
        
        console.log('--- SUCCESS: DATABASE IS BLANK ---');
        process.exit(0);
    } catch (err) {
        console.error('--- FAILURE: RESET FAILED ---', err);
        process.exit(1);
    }
}

hardReset();

