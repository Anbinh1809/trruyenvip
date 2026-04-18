import { withTitan } from '@/core/api/handler';
import { runTitanWorker, queueDiscovery } from '@/core/crawler/engine';
import { runFullMaintenance } from '@/core/database/maintenance';

export const POST = withTitan({
    admin: true,
    handler: async (req) => {
        const { action } = await req.json().catch(() => ({}));

        switch (action) {
            case 'start_autopilot':
                // Starts background loop if not already running
                runTitanWorker().catch(e => console.error('[API] Autopilot crash:', e.message));
                return { success: true, message: 'H? th?ng Guardian Autopilot d� đuo�c k�ch hoạt trong no�n.' };

            case 'force_discovery':
                // Immediate priority discovery
                await queueDiscovery('nettruyen', 5, 1, 10);
                await queueDiscovery('truyenqq', 5, 1, 10);
                return { success: true, message: 'L?nh Discovery (5 trang đầu) d� đuo�c đua v�o h�ng đo�i uu ti�n.' };

            case 'maintenance':
                // Run DB cleanup
                await runFullMaintenance();
                return { success: true, message: 'Tiến tr�nh do�n d?p (Maintenance) d� ho�n tất th�nh c�ng.' };

            default:
                throw new Error('H�nh đo�ng kh�ng h?p l?: ' + action);
        }
    }
});

