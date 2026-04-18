import { query } from '@/core/database/connection';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { message, stack, digest, url } = body;
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        // Log to guardianreports table for visibility in Admin Dashboard
        await query(`
            INSERT INTO guardianreports (type, message, details, severity)
            VALUES ('CRASH', @message, @details, 'CRITICAL')
        `, {
            message: message || 'Web Crash',
            details: JSON.stringify({ 
                stack, 
                digest, 
                url, 
                ip, 
                userAgent: request.headers.get('user-agent'),
                timestamp: new Date().toISOString()
            })
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        // Silently fail to avoid infinite error loops
        console.error('[REPORT_CRASH_FAILURE]', e);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

