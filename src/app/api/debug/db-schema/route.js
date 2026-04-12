import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // List all tables
        const tables = await query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = 'TruyenVip'
        `);
        
        // List columns for key tables
        const columns = await query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME IN ('Users', 'Manga', 'Chapters', 'Favorites')
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        `);

        // Check data counts
        const counts = {
            users: (await query("SELECT COUNT(*) as c FROM Users")).recordset[0].c,
            manga: (await query("SELECT COUNT(*) as c FROM Manga")).recordset[0].c,
            chapters: (await query("SELECT COUNT(*) as c FROM Chapters")).recordset[0].c
        };

        return NextResponse.json({
            tables: tables.recordset.map(t => t.TABLE_NAME),
            columns: columns.recordset,
            counts
        });
    } catch (e) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
