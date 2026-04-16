import { query } from '@/lib/db';
import { generateProxySignature } from '@/lib/crypto';
import { withTitan } from '@/lib/api-handler';

export const GET = withTitan({
    handler: async () => {
        const trending = await query(`
            SELECT m.id, m.title, m.cover, m.normalized_title
            FROM manga m
            LEFT JOIN chapters c ON m.id = c.manga_id
            GROUP BY m.id, m.title, m.cover, m.normalized_title
            ORDER BY m.views DESC, COUNT(c.id) DESC
            LIMIT 5
        `);

        return (trending.recordset || []).map(m => {
            const coverUrl = m.cover || '/placeholder-manga.svg';
            const w = 100;
            const q = 75; // Standardized quality
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
    }
});
