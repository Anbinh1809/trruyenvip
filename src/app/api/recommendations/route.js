import { query } from '@/core/database/connection';
import { getSignedProxyUrl } from '@/core/security/crypto';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get('mangaId');

    try {
        if (!mangaId) {
            // Default fallback for new users: Show recently updated top manga
            const trending = await query(`
                SELECT * FROM Manga 
                ORDER BY views DESC, last_crawled DESC 
                LIMIT 4
            `);
            return Response.json(trending.recordset.map(m => ({
                ...m,
                cover: m.cover?.startsWith('http') ? getSignedProxyUrl(m.cover, 300, 75) : (m.cover || '/placeholder-manga.svg')
            })));
        }

        // Find genres of this manga
        const genresRes = await query(`
            SELECT genre_id FROM MangaGenres WHERE manga_id = @mangaId
        `, { mangaId });

        if (genresRes.recordset.length === 0) {
            // Fallback to trending
            const trending = await query("SELECT * FROM Manga ORDER BY last_crawled DESC LIMIT 4");
            return Response.json(trending.recordset.map(m => ({
                ...m,
                cover: m.cover?.startsWith('http') ? getSignedProxyUrl(m.cover, 300, 75) : (m.cover || '/placeholder-manga.svg')
            })));
        }

        const genreId = genresRes.recordset[0].genre_id;

        // Find other manga with same genre
        const recommendationRes = await query(`
            SELECT m.* FROM Manga m
            JOIN MangaGenres mg ON m.id = mg.manga_id
            WHERE mg.genre_id = @genreId AND m.id != @mangaId
            ORDER BY m.last_crawled DESC
            LIMIT 4
        `, { genreId, mangaId });

        return Response.json(recommendationRes.recordset.map(m => ({
            ...m,
            cover: m.cover?.startsWith('http') ? getSignedProxyUrl(m.cover, 300, 75) : (m.cover || '/placeholder-manga.svg')
        })));
    } catch (err) {
        console.error('Recommendations api Error:', err);
        return Response.json({ error: 'database error' }, { status: 500 });
    }
}


