import { NextResponse } from 'next/server';
import { getSession } from '@/HeThong/BaoMat/XacThuc';
import { queueDiscovery } from '@/HeThong/CaoDuLieu';

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
            message: `Quy trà¬nh 'Äà o sà¢u' (Deep Scan) đã Ä‘ưo£c kà­ch hoáº¡t cho ${pages} trang của nguồn ${source}. Káº¿t quả sáº½ dáº§n xuáº¥t hiện trong Bảng Ä‘iou khioƒn.` 
        });
    } catch (err) {
        console.error('[DeepScan API] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

