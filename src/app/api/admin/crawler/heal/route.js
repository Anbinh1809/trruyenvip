import { NextResponse } from 'next/server';
import { getSession } from '@/core/security/auth';
import { healChapterGaps } from '@/core/crawler';

export async function POST(req) {
    try {
        const session = await getSession();
        if (session?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Trigger healing in the background to avoid timeout
        healChapterGaps(20).catch(err => console.error('[Healapi] Async error:', err));

        return NextResponse.json({ 
            success: true, 
            message: 'Quy trà¬nh vá lo—i (Gap Healing) dã Ä‘uo£c kà­ch hoáº¡t thành công!' 
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}


