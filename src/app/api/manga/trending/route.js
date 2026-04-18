import { query } from '@/core/database/connection';
import { generateProxySignature } from '@/core/security/crypto';
import { withTitan } from '@/core/api/handler';

export const GET = withTitan({
    handler: async () => {
        const trending = await query(`
            SELECT m.id, m.title, m.cover, m.normalized_title
            FROM manga m LEFT JOIN chapters c ON m.id = c.manga_id
            GROUP BY m.id ORDER BY m.views DESC, COUNT(c.id) DESC LIMIT 5
        `);

        return (trending.recordset || []).map(m => {
            const url = m.cover || '/placeholder-manga.svg';
            return {
                ...m,
                cover: url.startsWith('http') 
                    ? `/api/proxy?url=${encodeURIComponent(url)}&w=100&q=75&sig=${generateProxySignature(url, 100, 75)}` 
                    : url
            };
        });
    }
});


