import { query, MANGA_CARD_FIELDS, checkRateLimit } from '@/core/database/connection';
import { generateProxySignature } from '@/core/security/crypto';

/**
 * Fix #12: Added IP-based rate limiting to prevent DB query spam.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) return Response.json([]);

    // Rate limit: 30 searches per minute per IP
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const limiter = await checkRateLimit(`search_${ip}`, 30, 60);
    if (!limiter.success) {
        return Response.json([], { status: 429 });
    }

    // Titan-Fidelity: Search normalization
    const cleanQ = q.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    try {
        let res;
        // MATCH: LIKE search (SQL Server native)
        res = await query(`
            SELECT TOP(6) ${MANGA_CARD_FIELDS}
            FROM manga 
            WHERE normalized_title LIKE CONCAT('%', @q, '%')
            OR alternative_titles LIKE CONCAT('%', @q, '%')
            ORDER BY views_at_source DESC, last_crawled DESC
        `, { q: cleanQ });
        const results = (res.recordset || []).map(m => {
            const w = 100;
            const qv = 75;
            const coverUrl = m.cover || '/placeholder-manga.svg';
            let finalCover = coverUrl;

            if (coverUrl.startsWith('http')) {
                const sig = generateProxySignature(coverUrl, w, qv);
                finalCover = `/api/proxy?url=${encodeURIComponent(coverUrl)}&w=${w}&q=${qv}&sig=${sig}`;
            }

            return { ...m, cover: finalCover };
        });

        return Response.json(results);
    } catch (e) {
        console.error('Live Search Error:', e);
        return Response.json([]);
    }
}
