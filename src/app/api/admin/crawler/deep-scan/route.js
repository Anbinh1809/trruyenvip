import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { queueDiscovery } from '@/lib/crawler';

/**
 * Titan Deep Scan API
 * Allows administrators to trigger mass-discovery tasks across multiple pages.
 */
export async function POST(req) {
    try {
        const session = await getSession();
        if (session?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { source = 'nettruyen', pages = 10, startPage = 1 } = await req.json().catch(() => ({}));

        console.log(`[DeepScan] Manual Archival Triggered: ${source} (Next ${pages} pages starting from ${startPage})`);

        // We queue individual page discovery tasks to keep the workers granular
        for (let i = 0; i < pages; i++) {
            const page = startPage + i;
            // We use a high priority (7) for manual requests
            await queueDiscovery(source, 1, page, 7);
        }

        return NextResponse.json({ 
            success: true, 
            message: `Quy trình 'Đào sâu' (Deep Scan) đã được kích hoạt cho ${pages} trang của nguồn ${source}. Kết quả sẽ dần xuất hiện trong Bảng điều khiển.` 
        });
    } catch (err) {
        console.error('[DeepScan API] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
