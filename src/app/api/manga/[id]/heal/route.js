import { query } from '@/core/database/connection';
import { queueMangaSync } from '@/core/crawler/engine';
import { withTitan } from '@/core/api/handler';

export const POST = withTitan({
    auth: true,
    handler: async (req, session, context) => {
        // Robust parameter extraction for Next.js 15+ 
        const params = await (context?.params || {});
        const id = params.id;

        if (!id) throw { status: 400, message: 'Thiếu định danh truyện.' };

        const res = await query('SELECT TOP(1) id, source_url FROM manga WHERE id = @id OR normalized_title = @id', { id });
        const manga = res.recordset?.[0];

        if (!manga) throw { status: 404, message: 'Không tìm thấy bộ truyện' };
        if (!manga.source_url) throw { status: 400, message: 'Bộ truyện không có liên kết nguồn để khôi phục.' };

        // Force a high-priority sync
        const source = manga.source_url.includes('truyenqq') ? 'truyenqq' : 'nettruyen';
        await queueMangaSync(manga.id, manga.source_url, source, false, 10, true);

        return { 
            success: true, 
            message: 'Đã kích hoạt Titan Engine khôi phục dữ liệu. Vui lòng tải lại trang sau vài phút.' 
        };
    }
});
