import { query } from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get('mangaId');

    try {
        if (!mangaId) {
            // Default fallback for new users: Show recently updated top manga
            const trending = await query("SELECT TOP 4 * FROM Manga ORDER BY views DESC, last_crawled DESC");
            return Response.json(trending.recordset.map(m => ({
                ...m,
                cover: m.cover.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}` : m.cover
            })));
        }

        // Find genres of this manga
        const genresRes = await query(`
            SELECT genre_id FROM MangaGenres WHERE manga_id = @mangaId
        `, { mangaId });

        if (genresRes.recordset.length === 0) {
            // Fallback to trending
            const trending = await query("SELECT TOP 4 * FROM Manga ORDER BY last_crawled DESC");
            return Response.json(trending.recordset.map(m => ({
                ...m,
                cover: m.cover.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}` : m.cover
            })));
        }

        const genreId = genresRes.recordset[0].genre_id;

        // Find other manga with same genre
        const recommendationRes = await query(`
            SELECT TOP 4 m.* FROM Manga m
            JOIN MangaGenres mg ON m.id = mg.manga_id
            WHERE mg.genre_id = @genreId AND m.id != @mangaId
            ORDER BY m.last_crawled DESC
        `, { genreId, mangaId });

        return Response.json(recommendationRes.recordset.map(m => ({
            ...m,
            cover: m.cover.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(m.cover)}` : m.cover
        })));
    } catch (err) {
        console.error('Recommendations API Error:', err);
        return new Response('Database error', { status: 500 });
    }
}
