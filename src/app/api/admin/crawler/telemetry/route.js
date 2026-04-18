import { NextResponse } from 'next/server';
import { getSession } from '@/core/security/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (session?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Access the global state managed by crawler.js
        const state = global.crawlerState || {
            status: 'idle',
            currentManga: null,
            currentChapter: null,
            currentImage: null,
            successCount: 0,
            failCount: 0,
            concurrencyLimit: 128,
            lastAction: Date.now()
        };

        const memory = process.memoryUsage();
        const memoryMB = Math.round(memory.heapUsed / 1024 / 1024);

        return NextResponse.json({
            success: true,
            ...state,
            ramUsage: memoryMB,
            memoryMB
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}


