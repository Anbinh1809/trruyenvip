import { withTitan } from '@/lib/api-handler';
import { ingestMangaBySlug } from '@/lib/crawler/engine';

export const POST = withTitan({
    admin: false, // Allow public discovery to make the site feel "Infinity"
    handler: async (req) => {
        try {
            const body = await req.json().catch(() => ({}));
            const { slug, source = 'nettruyen' } = body;

            if (!slug) {
                return { success: false, message: 'Thiếu slug truyện.' };
            }

            console.log(`[Aegis:OnDemand] Triggering ingestion for: ${slug} (${source})`);
            const ResultId = await ingestMangaBySlug(slug, source);
            
            return { 
                success: true, 
                message: `Dữ liệu truyện ${slug} đang được đồng bộ hóa. Vui lòng F5 sau vài giây.`,
                id: ResultId
            };
        } catch (error) {
            console.error('[On-Demand API Error]:', error);
            return { success: false, message: 'Không thể kích hoạt đồng bộ: ' + error.message };
        }
    }
});
