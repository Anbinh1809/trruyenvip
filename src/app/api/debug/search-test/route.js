import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    // 1. PROD GUARD: Strict security lock
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Tính năng này không được phép trên môi trường thực tế.' }, { status: 403 });
    }

    try {
        // 1. Check sample manga
        const all = await query('SELECT title FROM "Manga" LIMIT 5');
        
        // 2. Try searches (PostgreSQL native syntax)
        const test1 = await query("SELECT id, title FROM \"Manga\" WHERE title ILIKE '%Bấp%'");
        const test2 = await query("SELECT id, title FROM \"Manga\" WHERE title ILIKE '%Solo%'");
        
        // 3. Check Collation
        const collation = await query("SELECT collation_name FROM information_schema.columns WHERE column_name = 'title' AND table_name = 'manga'");

        return NextResponse.json({
            sample_titles: (all.recordset || []).map(r => r.title),
            results: {
                search_bap: test1.recordset?.length || 0,
                search_solo: test2.recordset?.length || 0
            },
            collation: collation.recordset?.[0]?.collation_name || 'unknown'
        });
    } catch (e) {
        console.error('Debug Search Error:', e);
        return NextResponse.json({ error: 'Lỗi truy xuất dữ liệu tìm kiếm' }, { status: 500 });
    }
}
