import { crawlFullMangaChapters } from '@/core/crawler';
import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const POST = withTitan({
    admin: true,
    handler: async (req) => {
        const { mangaId } = await req.json();
        if (!mangaId) throw Object.assign(new Error('Missing mangaId'), { status: 400 });

        const mangaData = await query('SELECT source_url FROM manga WHERE id = @id', { id: mangaId });
        if (!mangaData.recordset?.[0]) {
            throw Object.assign(new Error('Manga not found'), { status: 404 });
        }

        const manga = mangaData.recordset[0];
        if (!manga.source_url) throw Object.assign(new Error('Manga has no source URL'), { status: 400 });
        const source = manga.source_url?.includes('nettruyen') ? 'nettruyen' : 'truyenqq';

        crawlFullMangaChapters(mangaId, manga.source_url, source).catch(e => {
            console.error(`[REPAIR-GAP] Error for ${mangaId}:`, e.message);
        });

        return { success: true, message: 'Repair cycle started in background.' };
    }
});


