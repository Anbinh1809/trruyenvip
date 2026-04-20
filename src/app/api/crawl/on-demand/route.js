import { ingestMangaBySlug } from '@/core/crawler/engine';
import { withTitan } from '@/core/api/handler';

export const runtime = 'nodejs';

/**
 * Fix #11: Added `auth: true` — anonymous users must not trigger full manga crawls.
 */
export const POST = withTitan({
    auth: true,
    handler: async (req) => {
        const { slug, source } = await req.json();

        if (!slug) {
            throw { status: 400, message: 'Thiếu slug truyện' };
        }

        try {
            const finalSlug = await ingestMangaBySlug(slug, source || 'nettruyen');
            return { success: true, message: 'Khởi tạo quy trình khám phá thành công', slug: finalSlug };
        } catch (err) {
            throw { status: 500, message: 'Lỗi khởi tạo Titan Engine: ' + err.message };
        }
    }
});
