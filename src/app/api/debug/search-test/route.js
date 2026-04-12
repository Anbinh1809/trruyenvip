import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // 1. Check first 5 manga to see titles
        const all = await query("SELECT TOP 5 title FROM Manga");
        
        // 2. Try various searches
        const test1 = await query("SELECT id, title FROM Manga WHERE title LIKE N'%B?p%'");
        const test2 = await query("SELECT id, title FROM Manga WHERE title LIKE N'%Solo%'");
        const test3 = await query("SELECT id, title FROM Manga WHERE title LIKE '%B?p%'");
        
        // 3. Check Collation
        const collation = await query("SELECT collation_name FROM sys.columns WHERE name = 'title' AND object_id = OBJECT_ID('Manga')");

        return NextResponse.json({
            sample_titles: all.recordset.map(r => r.title),
            results: {
                unicode_bup: test1.recordset.length,
                unicode_solo: test2.recordset.length,
                plain_bup: test3.recordset.length
            },
            collation: collation.recordset[0]?.collation_name
        });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
