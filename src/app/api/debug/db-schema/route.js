import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    // 1. PROD GUARD: Strict security lock
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Tính năng này không được phép trên môi trường thực tế.' }, { status: 403 });
    }

    try {
        // 2. LIST TABLES (PostgreSQL compliant)
        const tables = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        // 3. LIST COLUMNS (PostgreSQL compliant)
        const columns = await query(`
            SELECT table_name, column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name IN ('users', 'manga', 'chapters', 'favorites')
            AND table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `);

        // 4. DATA COUNTS (Null-safe)
        const counts = {
            users: (await query('SELECT COUNT(*) as c FROM "Users"')).recordset?.[0]?.c || 0,
            manga: (await query('SELECT COUNT(*) as c FROM "Manga"')).recordset?.[0]?.c || 0,
            chapters: (await query('SELECT COUNT(*) as c FROM "Chapters"')).recordset?.[0]?.c || 0
        };

        return NextResponse.json({
            success: true,
            tables: (tables.recordset || []).map(t => t.table_name),
            columns: columns.recordset || [],
            counts
        });
    } catch (e) {
        console.error('Debug Schema Error:', e);
        return NextResponse.json({ error: 'Lỗi truy xuất sơ đồ dữ liệu' }, { status: 500 });
    }
}
