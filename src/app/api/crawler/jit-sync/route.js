import { crawlChapterImages } from '@/lib/crawler';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

// In-memory rate limiting map for JIT sync
const jitRateLimit = new Map();

export const runtime = 'nodejs';
// Give Vercel serverless enough time to complete the crawl
export const maxDuration = 60;

export async function POST(req) {
    try {
        const session = await getSession();
        const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'local';
        const rateLimitKey = session ? session.uuid : `guest_${clientIp}`;

        const { chapterId } = await req.json();
        if (!chapterId) return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });

        // Rate Limit: 1 sync per 15 seconds per user, 45s per guest
        const now = Date.now();
        const lastSync = jitRateLimit.get(rateLimitKey) || 0;
        const cooldown = session ? 15000 : 45000;

        if (now - lastSync < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastSync)) / 1000);
            return NextResponse.json({ 
                error: `Thao tác quá nhanh, vui lòng đợi ${remaining}s` 
            }, { status: 429 });
        }
        jitRateLimit.set(rateLimitKey, now);

        const chapData = await query("SELECT source_url FROM Chapters WHERE id = @id", { id: chapterId });
        if (chapData.recordset.length === 0) {
            return NextResponse.json({ error: 'Chapter not found in database' }, { status: 404 });
        }

        const chapter = chapData.recordset[0];
        if (!chapter.source_url) {
            return NextResponse.json({ error: 'Chapter has no source URL' }, { status: 422 });
        }
        
        const source = chapter.source_url.includes('nettruyen') ? 'nettruyen' : 'truyenqq';

        // VERCEL FIX: Run the crawl synchronously within the request lifecycle.
        // Fire-and-forget tasks are killed by Vercel immediately after the response.
        // We await here — maxDuration = 60s gives plenty of time.
        console.log(`[JIT-SYNC] Crawling ${chapterId} from ${chapter.source_url}`);
        await crawlChapterImages(chapterId, chapter.source_url, source);

        // Verify images were actually saved
        const imgCheck = await query(
            'SELECT COUNT(*) as count FROM ChapterImages WHERE chapter_id = @id',
            { id: chapterId }
        );
        const imageCount = parseInt(imgCheck.recordset[0]?.count || 0);

        console.log(`[JIT-SYNC] Done: ${imageCount} images saved for ${chapterId}`);

        return NextResponse.json({ 
            success: true, 
            message: `Sync complete: ${imageCount} images`,
            imageCount
        });
    } catch (err) {
        console.error('[JIT-SYNC] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
