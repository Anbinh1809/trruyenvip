import { crawlChapterImages } from '@/lib/crawler';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

// In-memory rate limiting map for JIT sync
const jitRateLimit = new Map();

export const runtime = 'nodejs';
// Allow up to 55 seconds for the crawl to complete on Vercel
export const maxDuration = 55;

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

        // Check if images already exist - avoid crawling if already done by another request
        const existingCheck = await query(
            'SELECT COUNT(*) as count FROM ChapterImages WHERE chapter_id = @id',
            { id: chapterId }
        );
        const existingCount = parseInt(existingCheck.recordset[0]?.count || 0);
        if (existingCount > 5) {
            return NextResponse.json({ success: true, message: 'Already synced', imageCount: existingCount });
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

        console.log(`[JIT-SYNC] Crawling ${chapterId} from ${chapter.source_url}`);

        // Race the crawl against a 45s timeout to avoid Vercel 504
        const CRAWL_TIMEOUT = 45000;
        const crawlPromise = crawlChapterImages(chapterId, chapter.source_url, source);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('CRAWL_TIMEOUT')), CRAWL_TIMEOUT)
        );

        try {
            await Promise.race([crawlPromise, timeoutPromise]);
        } catch (crawlErr) {
            if (crawlErr.message === 'CRAWL_TIMEOUT') {
                console.warn(`[JIT-SYNC] Crawl timed out for ${chapterId}, checking partial results`);
            } else {
                throw crawlErr;
            }
        }

        // Check how many images were saved (partial or complete)
        const imgCheck = await query(
            'SELECT COUNT(*) as count FROM ChapterImages WHERE chapter_id = @id',
            { id: chapterId }
        );
        const imageCount = parseInt(imgCheck.recordset[0]?.count || 0);

        console.log(`[JIT-SYNC] Done: ${imageCount} images for ${chapterId}`);

        if (imageCount === 0) {
            return NextResponse.json({ 
                error: 'Không thể cào ảnh từ nguồn này. Nguồn có thể đang bảo trì hoặc không hỗ trợ chương này.',
                imageCount: 0
            }, { status: 503 });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Sync done: ${imageCount} images`,
            imageCount
        });
    } catch (err) {
        console.error('[JIT-SYNC] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
