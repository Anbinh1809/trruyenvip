import { withTitan } from '@/lib/api-handler';
import { runTitanWorker, queueDiscovery } from '@/lib/crawler/engine';
import { cleanLegacyEncoding } from '@/lib/db';

export const POST = withTitan({
    admin: true,
    handler: async (req) => {
        const { action } = await req.json().catch(() => ({}));

        switch (action) {
            case 'start_autopilot':
                // Starts background loop if not already running
                runTitanWorker().catch(e => console.error('[API] Autopilot crash:', e.message));
                return { success: true, message: 'Hệ thống Guardian Autopilot đã được kích hoạt trong nền.' };

            case 'force_discovery':
                // Immediate priority discovery
                await queueDiscovery('nettruyen', 5, 1, 10);
                await queueDiscovery('truyenqq', 5, 1, 10);
                return { success: true, message: 'Lệnh Discovery (5 trang đầu) đã được đưa vào hàng đợi ưu tiên.' };

            case 'maintenance':
                // Run DB cleanup
                await cleanLegacyEncoding();
                return { success: true, message: 'Tiến trình dọn dẹp (Maintenance) đã hoàn tất thành công.' };

            default:
                throw new Error('Hành động không hợp lệ: ' + action);
        }
    }
});
