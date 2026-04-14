import { withTitan } from '@/lib/api-handler';
import { queueDiscovery } from '@/lib/crawler';

export const POST = withTitan({
    admin: true,
    handler: async (req) => {
        try {
            const body = await req.json().catch(() => ({}));
            const pageCount = parseInt(body.pages) || 1;

            // Trigger discovery for primary mirrors
            await queueDiscovery('nettruyen', pageCount, 1, 10);
            await queueDiscovery('truyenqq', pageCount, 1, 10);
            
            return { 
                success: true, 
                message: `Tiến trình quét ${pageCount} trang đã được đưa vào hàng đợi thành công.` 
            };
        } catch (error) {
            throw new Error('Không thể kích hoạt quét dữ liệu: ' + error.message);
        }
    }
});
