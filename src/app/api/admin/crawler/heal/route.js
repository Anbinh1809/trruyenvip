import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { healChapterGaps } from '@/lib/crawler';

export async function POST(req) {
    try {
        const session = await getSession();
        if (session?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Trigger healing in the background to avoid timeout
        healChapterGaps(20).catch(err => console.error('[HealAPI] Async error:', err));

        return NextResponse.json({ 
            success: true, 
            message: 'Quy trình vá lỗi (Gap Healing) đã được kích hoạt thành công!' 
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
