import { NextResponse } from 'next/server';
import { getSession } from '@/core/security/auth';
import { queueDiscovery } from '@/core/crawler';
import { withTitan } from '@/core/api/handler';

/**
 * Fix #20: Rewritten to use withTitan — the other deep-scan at api/admin/deep-scan already handles
 * CRON_SECRET auth. This one is admin-only.
 */
export const POST = withTitan({
    admin: true,
    handler: async (req) => {
        const { source = 'nettruyen', pages = 10, startPage = 1 } = await req.json().catch(() => ({}));

        console.log(`[DeepScan] Manual Archival Triggered: ${source} (Next ${pages} pages starting from ${startPage})`);

        for (let i = 0; i < pages; i++) {
            const page = startPage + i;
            await queueDiscovery(source, 1, page, 7);
        }

        return {
            success: true,
            message: `Quy trình 'Đào sâu' (Deep Scan) đã được kích hoạt cho ${pages} trang của nguồn ${source}. Kết quả sẽ dần xuất hiện trong Bảng điều khiển.`
        };
    }
});
