import { ingestMangaBySlug } from '@/core/crawler/engine';
import { withTitan } from '@/core/api/handler';

export const runtime = 'nodejs';

export const POST = withTitan({
    handler: async (req) => {
        const { slug, source } = await req.json();
        
        if (!slug) {
            throw { status: 400, message: 'Thiếu slug truyện' };
        }

        console.log(`[API:Discovery] Request for ${slug} on ${source || 'nettruyen'}`);
        
        try {
            const finalSlug = await ingestMangaBySlug(slug, source || 'nettruyen');
            return { 
                success: true, 
                message: 'Khởi tạo quy trình khám phá thành công',
                slug: finalSlug
            };// tui đang cần lắm 1 cái để test á, 
        } catch (err) {
            console.error('[Discovery Error]', err.message);
            throw { status: 500, message: 'Lỗi khởi tạo Titan Engine: ' + err.message };
        }
    }
});
