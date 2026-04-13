import { query } from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) return Response.json([]);

    // Titan-Fidelity: Search normalization
    const cleanQ = q.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    try {
        const res = await query(`
            SELECT id, title, cover, last_chap_num, views_at_source as views
            FROM Manga 
            WHERE normalized_title LIKE @q + '%' -- Indexed prefix search
            OR normalized_title LIKE '%-' + @q + '%' -- Mid-word match
            ORDER BY 
                CASE WHEN normalized_title LIKE @q + '%' THEN 0 ELSE 1 END,
                views_at_source DESC,
                last_crawled DESC
            LIMIT 6
        `, { q: cleanQ });


        return Response.json(res.recordset.map(m => ({
            ...m,
            cover: m.cover?.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}` : (m.cover || '/placeholder-manga.svg'),
        })));
    } catch (e) {
        console.error('Live Search Error:', e);
        return Response.json([]);
    }
}
