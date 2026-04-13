import { NextResponse } from 'next/server';

export async function GET() {
    // Returns current server time in UTC+7 (Vietnam time)
    // for mission and check-in validation.
    const now = new Date();
    
    return NextResponse.json({
        now: now.toISOString(),
        dateString: now.toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }), // Stability for Vietnam
        timestamp: now.getTime()
    });
}
