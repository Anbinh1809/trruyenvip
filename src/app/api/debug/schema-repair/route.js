import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    // 1. PROD GUARD: Strict security lock
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Tính năng này không được phép trên môi trường thực tế.' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        console.log('--- Starting Schema Repair ---');
        
        // 1. Favorites Table
        await query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Favorites')
            CREATE TABLE Favorites (
                id INT IDENTITY(1,1) PRIMARY KEY,
                user_uuid NVARCHAR(255),
                manga_id NVARCHAR(255),
                created_at DATETIME DEFAULT GETDATE(),
                UNIQUE(user_uuid, manga_id)
            )
        `);
        console.log('[OK] Favorites Table');

        // 2. DailyCheckins Table
        await query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DailyCheckins')
            CREATE TABLE DailyCheckins (
                id INT IDENTITY(1,1) PRIMARY KEY,
                user_uuid NVARCHAR(255),
                checkin_date DATE NOT NULL,
                streak INT DEFAULT 1,
                created_at DATETIME DEFAULT GETDATE(),
                UNIQUE(user_uuid, checkin_date)
            )
        `);
        console.log('[OK] DailyCheckins Table');

        // 3. User UUID Migration (Ensure it exists as standard)
        // Just a check
        const userCols = await query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'uuid'");
        if (userCols.recordset.length === 0) {
            await query("ALTER TABLE Users ADD uuid NVARCHAR(255) UNIQUE");
            console.log('[MIGRATE] Added uuid to Users');
        }

        // 5. Deep Metadata Sync / Limitless Sync (Optional)
        const deepSync = searchParams.get('deepSync') === 'true';
        const limitless = searchParams.get('limitless') === 'true';
        let syncCount = 0;
        const mangaCount = await query("SELECT COUNT(*) as c FROM Manga");

        if (limitless) {
            const { crawlLatest } = await import('@/lib/crawler');
            // Trigger limitless crawl as non-blocking background task
            crawlLatest(true, true).catch(e => console.error('Limitless background error:', e));
        } else if (deepSync) {
            const targets = await query("SELECT id, source_url FROM Manga WHERE author IS NULL OR author = '?ang c?p nh?t'");
            
            // Sync up to 20 manga instantly for the debug tool
            for (const m of targets.recordset.slice(0, 20)) {
                const source = m.source_url.includes('nettruyen') ? 'nettruyen' : 'truyenqq';
                const { crawlFullMangaChapters } = await import('@/lib/crawler');
                await crawlFullMangaChapters(m.id, m.source_url, source);
                syncCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: "Schema and basic data repaired.", 
            syncCount,
            results: {
                manga: mangaCount.recordset[0].c,
                genres: (await query("SELECT COUNT(*) as c FROM Genres")).recordset[0].c,
                relationships: (await query("SELECT COUNT(*) as c FROM MangaGenres")).recordset[0].c
            }
        });
    } catch (e) {
        console.error('Schema Repair Failed:', e);
        return NextResponse.json({
            success: false,
            error: e.message
        }, { status: 500 });
    }
}
