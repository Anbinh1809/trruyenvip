import { crawlChapterImages } from '@/lib/crawler';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

// In-memory rate limiting map for JIT sync
const jitRateLimit = new Map();

export async function POST(req) {
    try {
        const session = await getSession();
        const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'local';
        const rateLimitKey = session ? session.uuid : `guest_${clientIp}`;

        const { chapterId } = await req.json();
        if (!chapterId) return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });

        // Rate Limit: 1 sync per 10 seconds per user, 30s per guest
        const now = Date.now();
        const lastSync = jitRateLimit.get(rateLimitKey) || 0;
        const cooldown = session ? 10000 : 30000;

        if (now - lastSync < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastSync)) / 1000);
            return NextResponse.json({ 
                error: `Thao tác quá nhanh, vui lòng đợi ${remaining}s` 
            }, { status: 429 });
        }
        jitRateLimit.set(rateLimitKey, now);

        const chapData = await query("SELECT source_url FROM Chapters WHERE id = @id", { id: chapterId });
        if (chapData.recordset.length === 0) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }

        const chapter = chapData.recordset[0];
        const source = chapter.source_url.includes('nettruyen') ? 'nettruyen' : 'truyenqq';

        // Trigger background crawl
        console.log(`[JIT-SYNC] Starting background crawl for ${chapterId} by ${session?.username || 'Guest'}`);
        crawlChapterImages(chapterId, chapter.source_url, source).catch(e => {
            console.error(`[JIT-SYNC] Error for ${chapterId}:`, e.message);
        });

        return NextResponse.json({ success: true, message: 'Sync started' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
