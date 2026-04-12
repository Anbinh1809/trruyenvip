import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Test database connection with a simple query
        const result = await query('SELECT 1 as status');
        
        if (result.recordset.length > 0) {
            return NextResponse.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                database: 'connected',
                uptime: process.uptime()
            });
        }
        
    } catch (e) {
        return NextResponse.json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            database: 'error',
            error: e.message
        }, { status: 503 });
    }
}
