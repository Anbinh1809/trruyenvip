import { NextResponse } from 'next/server';

export async function GET() {
    // Returns current server time in UTC+7 (Vietnam time)
    // for mission and check-in validation.
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    
    return NextResponse.json({
        now: vnTime.toISOString(),
        dateString: vnTime.toDateString(), // e.g. "Sun Apr 12 2026"
        timestamp: vnTime.getTime()
    });
}
