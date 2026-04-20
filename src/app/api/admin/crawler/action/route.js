import { withTitan } from '@/core/api/handler';
import { runTitanWorker, queueDiscovery } from '@/core/crawler/engine';
import { runFullMaintenance } from '@/core/database/maintenance';

export const POST = withTitan({
    admin: true,
    handler: async (req) => {
        const { action } = await req.json().catch(() => ({}));

        switch (action) {
            case 'start_autopilot':
                // Starts background loop persistently (oneShot = false)
                runTitanWorker(false).catch(e => console.error('[API] Autopilot crash:', e.message));
                return { success: true, message: 'Hệ thống Guardian Autopilot đã được kích hoạt chạy ngầm.' };

            case 'force_discovery':
                // Immediate priority discovery
                await queueDiscovery('nettruyen', 5, 1, 10);
                await queueDiscovery('truyenqq', 5, 1, 10);
                return { success: true, message: 'Lệnh Discovery (5 trang đầu) đã được đưa vào hàng đợi ưu tiên.' };

            case 'maintenance':
                // Run DB cleanup
                await runFullMaintenance();
                return { success: true, message: 'Tiến trình dọn dẹp (Maintenance) đã hoàn tất thành công.' };

            default:
                throw new Error('Hành động không hợp lệ: ' + action);
        }
    }
});
