import { runFullMaintenance } from '@/core/database/maintenance';
import { NextResponse } from 'next/server';

/**
 * TITAN MAINTENANCE ENDPOINT
 * Can be triggered by GitHub Actions Cron, Vercel Cron, or manual admin action.
 */
export async function GET(request) {
    // Basic Security: Check for internal secret key
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const secret = process.env.MAINTENANCE_KEY || 'truyenvip_polaris_2026';

    if (key !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = await runFullMaintenance();
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });
    } catch (e) {
        return NextResponse.json({
            success: false,
            error: e.message
        }, { status: 500 });
    }
}

// Support POST for traditional cron services
export async function POST(request) {
    return GET(request);
}

