import { query, MANGA_CARD_FIELDS } from '@/lib/db';
import { generateProxySignature } from '@/lib/crypto';

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
        let res;
        try {
            // PRIMARY: Trigram similarity match (Superior relevance)
            res = await query(`
                SELECT ${MANGA_CARD_FIELDS}
                FROM manga 
                WHERE normalized_title % @q 
                OR normalized_title LIKE CONCAT('%', @q, '%')
                OR alternative_titles % @q
                ORDER BY 
                    similarity(normalized_title, @q) DESC,
                    views_at_source DESC,
                    last_crawled DESC
                LIMIT 6
            `, { q: cleanQ });
        } catch (trgmError) {
            // FALLBACK: Traditional LIKE search (Ensures zero-downtime if extension is missing)
            res = await query(`
                SELECT ${MANGA_CARD_FIELDS}
                FROM manga 
                WHERE normalized_title LIKE CONCAT('%', @q, '%')
                OR alternative_titles LIKE CONCAT('%', @q, '%')
                ORDER BY views_at_source DESC, last_crawled DESC
                LIMIT 6
            `, { q: cleanQ });
        }

        const results = (res.recordset || []).map(m => {
            const w = 100;
            const q = 75;
            const coverUrl = m.cover || '/placeholder-manga.svg';
            let finalCover = coverUrl;

            if (coverUrl.startsWith('http')) {
                // Ensure w and q are passed exactly as they will be parsed in the proxy route
                const sig = generateProxySignature(coverUrl, w, q);
                finalCover = `/api/proxy?url=${encodeURIComponent(coverUrl)}&w=${w}&q=${q}&sig=${sig}`;
            }

            return {
                ...m,
                cover: finalCover
            };
        });

        return Response.json(results);
    } catch (e) {
        console.error('Live Search Error:', e);
        return Response.json([]);
    }
}
