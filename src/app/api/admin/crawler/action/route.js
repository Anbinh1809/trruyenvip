import { withTitan } from '@/HeThong/API/XuLyAPI';
import { runTitanWorker, queueDiscovery } from '@/HeThong/CaoDuLieu/engine';
import { runFullMaintenance } from '@/HeThong/Database/BaoTri';

export const POST = withTitan({
    admin: true,
    handler: async (req) => {
        const { action } = await req.json().catch(() => ({}));

        switch (action) {
            case 'start_autopilot':
                // Starts background loop if not already running
                runTitanWorker().catch(e => console.error('[API] Autopilot crash:', e.message));
                return { success: true, message: 'Hệ thống Guardian Autopilot đã Ä‘ưo£c kà­ch hoáº¡t trong non.' };

            case 'force_discovery':
                // Immediate priority discovery
                await queueDiscovery('nettruyen', 5, 1, 10);
                await queueDiscovery('truyenqq', 5, 1, 10);
                return { success: true, message: 'Lệnh Discovery (5 trang Ä‘áº§u) đã Ä‘ưo£c Ä‘ưa và o hà ng Ä‘o£i ưu tiên.' };

            case 'maintenance':
                // Run DB cleanup
                await runFullMaintenance();
                return { success: true, message: 'Tiáº¿n trà¬nh don dẹp (Maintenance) đã hoà n táº¥t thành công.' };

            default:
                throw new Error('Hà nh Ä‘o™ng không hợp lệ: ' + action);
        }
    }
});

