import { withTitan } from '@/lib/api-handler';
import { queueDiscovery } from '@/lib/crawler';

export const POST = withTitan({
    admin: true,
    handler: async () => {
        try {
            // Trigger discovery for primary mirrors
            await queueDiscovery('nettruyen', 1, 1, 10);
            await queueDiscovery('truyenqq', 1, 1, 10);
            
            return { 
                success: true, 
                message: 'Tiến trình quét dữ liệu đã được đưa vào hàng đợi thành công.' 
            };
        } catch (error) {
            throw new Error('Không thể kích hoạt quét dữ liệu: ' + error.message);
        }
    }
});
