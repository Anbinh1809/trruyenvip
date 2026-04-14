import { queueDiscovery } from '@/lib/crawler';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const pages = parseInt(searchParams.get('pages') || '20');
    const start = parseInt(searchParams.get('start') || '1');
    const source = searchParams.get('source') || 'nettruyen';
    
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log(`[Admin] Manual Deep Scan Triggered: ${source}, ${pages} pages starting from ${start}`);
        
        // Split large scans into multiple smaller tasks for the worker to pick up
        // Max 50 pages per batch to keep task size reasonable
        const batchSize = 10;
        const batches = Math.ceil(pages / batchSize);
        
        for (let i = 0; i < batches; i++) {
            const batchStart = start + (i * batchSize);
            const batchCount = Math.min(batchSize, pages - (i * batchSize));
            
            // Priority 8 for manual admin triggers (Standard latest is 3)
            await queueDiscovery(source, batchCount, batchStart, 8);
        }

        return NextResponse.json({ 
            success: true, 
            message: `Queued ${pages} pages for deep scan in ${batches} high-priority batches.` 
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
