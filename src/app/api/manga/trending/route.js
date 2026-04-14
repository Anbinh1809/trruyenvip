import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Trending logic: Manga with most chapters or recently updated in the last 24h
        // For simplicity, we'll take top 5 most viewed (if views column existed) 
        // OR just top 5 with most chapters as a proxy for 'active/popular'
        const trending = await query(`
            SELECT m.id, m.title, m.cover
            FROM manga m
            JOIN chapters c ON m.id = c.manga_id
            GROUP BY m.id, m.title, m.cover
            ORDER BY COUNT(c.id) DESC
            LIMIT 5
        `);

        const optimized = (trending.recordset || []).map(m => ({
            ...m,
            cover: m.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}` : (m.cover || '/placeholder-manga.svg')
        }));

        return NextResponse.json(optimized);
    } catch (err) {
        return new Response('Error', { status: 500 });
    }
}
