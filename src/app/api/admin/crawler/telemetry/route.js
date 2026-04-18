import { NextResponse } from 'next/server';
import { getSession } from '@/core/security/auth';
import { loadSystemState } from '@/core/database/connection';

export async function GET() {
    try {
        const session = await getSession();
        if (session?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Access the global state managed by crawler.js
        const state = global.crawlerState || {
            status: 'idle',
            concurrencyLimit: BASE_CONCURRENCY || 10,
            activeWorkers: 0
        };

        const lastPulseAt = await loadSystemState('crawler_last_pulse_at');

        const memory = process.memoryUsage();
        const memoryMB = Math.round(memory.rss / 1024 / 1024);

        return NextResponse.json({
            success: true,
            ...state,
            lastPulseAt,
            ramUsage: memoryMB,
            memoryMB
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}


