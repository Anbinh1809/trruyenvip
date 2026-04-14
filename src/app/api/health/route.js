import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Test database connection with a simple query
        const result = await query('SELECT 1 as status');
        
        const mem = process.memoryUsage();
        if (result.recordset.length > 0) {
            return NextResponse.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                database: 'connected',
                memory: {
                   rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
                   heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
                   heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`
                },
                uptime: `${Math.round(process.uptime())}s`
            });
        }
        
    } catch (e) {
        return NextResponse.json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            database: 'error',
            // IRONCLAD DEFENSE: Never leak raw error messages in production
            error: process.env.NODE_ENV === 'production' ? 'Database connection failed' : e.message
        }, { status: 503 });
    }
}
