import { query } from '@/lib/db';
import { generateProxySignature } from '@/lib/crypto';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const trending = await query(`
            SELECT m.id, m.title, m.cover, m.normalized_title
            FROM manga m
            JOIN chapters c ON m.id = c.manga_id
            GROUP BY m.id, m.title, m.cover, m.normalized_title
            ORDER BY COUNT(c.id) DESC
            LIMIT 5
        `);

        const optimized = (trending.recordset || []).map(m => {
            const coverUrl = m.cover || '/placeholder-manga.svg';
            const w = 100;
            const q = 70;
            let finalCover = coverUrl;

            if (coverUrl.startsWith('http')) {
                const sig = generateProxySignature(coverUrl, w, q);
                finalCover = `/api/proxy?url=${encodeURIComponent(coverUrl)}&w=${w}&q=${q}&sig=${sig}`;
            }

            return {
                ...m,
                cover: finalCover
            };
        });

        return NextResponse.json(optimized);
    } catch (err) {
        return new Response('Error', { status: 500 });
    }
}
