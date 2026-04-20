import { query, MANGA_CARD_FIELDS } from '@/core/database/connection';
import { getSignedProxyUrl } from '@/core/security/crypto';
import { withTitan } from '@/core/api/handler';

/**
 * Fix #4:
 * - Wrapped in withTitan for security headers
 * - Use MANGA_CARD_FIELDS instead of SELECT * to avoid leaking internal columns
 */
export const GET = withTitan({
    handler: async (request) => {
        const { searchParams } = new URL(request.url);
        const mangaId = searchParams.get('mangaId');

        const mapCover = (m) => ({
            ...m,
            cover: m.cover?.startsWith('http')
                ? getSignedProxyUrl(m.cover, 300, 75)
                : (m.cover || '/placeholder-manga.svg')
        });

        if (!mangaId) {
            const trending = await query(`
                SELECT ${MANGA_CARD_FIELDS}
                FROM manga
                ORDER BY views DESC, last_crawled DESC
                LIMIT 4
            `);
            return (trending.recordset || []).map(mapCover);
        }

        const genresRes = await query(`
            SELECT genre_id FROM mangagenres WHERE manga_id = @mangaId
        `, { mangaId });

        if (!genresRes.recordset?.length) {
            const trending = await query(`
                SELECT ${MANGA_CARD_FIELDS}
                FROM manga
                ORDER BY last_crawled DESC LIMIT 4
            `);
            return (trending.recordset || []).map(mapCover);
        }

        const genreId = genresRes.recordset[0].genre_id;

        const recommendationRes = await query(`
            SELECT ${MANGA_CARD_FIELDS.split(', ').map(f => `m.${f.trim()}`).join(', ')}
            FROM manga m
            JOIN mangagenres mg ON m.id = mg.manga_id
            WHERE mg.genre_id = @genreId AND m.id != @mangaId
            ORDER BY m.last_crawled DESC
            LIMIT 4
        `, { genreId, mangaId });

        return (recommendationRes.recordset || []).map(mapCover);
    }
});
