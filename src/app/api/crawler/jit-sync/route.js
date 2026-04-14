import { crawlChapterImages } from '@/lib/crawler';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

// In-memory telemetry for real-time debugging
const jitTelemetry = new Map();

export const runtime = 'nodejs';
export const maxDuration = 55;

export async function POST(req) {
    const startTime = Date.now();
    try {
        const session = await getSession();
        const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'local';
        const rateLimitKey = session ? session.uuid : `guest_${clientIp}`;

        const { chapterId } = await req.json();
        if (!chapterId) return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });

        // Cooldown checks
        const lastSync = jitTelemetry.get(rateLimitKey) || 0;
        const cooldown = session ? 8000 : 25000;
        if (Date.now() - lastSync < cooldown) {
            const remaining = Math.ceil((cooldown - (Date.now() - lastSync)) / 1000);
            return NextResponse.json({ 
                error: `Hệ thống đang xử lý, vui lòng chờ ${remaining}s...`,
                isCooldown: true
            }, { status: 429 });
        }

        // Fast-path: Check if already exists
        const existing = await query('SELECT COUNT(*) as count FROM chapterimages WHERE chapter_id = @id', { id: chapterId });
        if (parseInt(existing.recordset[0].count) >= 1) {
            return NextResponse.json({ success: true, imageCount: existing.recordset[0].count });
        }

        jitTelemetry.set(rateLimitKey, Date.now());

        const chapData = await query("SELECT source_url FROM chapters WHERE id = @id", { id: chapterId });
        if (chapData.recordset.length === 0) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });

        const chapter = chapData.recordset[0];
        const source = chapter.source_url?.includes('nettruyen') ? 'nettruyen' : 'truyenqq';

        console.log(`[TITAN INFO] JIT Sync Triggered: ${chapterId}`);

        // Execution with race timeout
        const CRAWL_TIMEOUT = 45000;
        let crawlResult = 0;
        let errorStatus = 'UNKNOWN';

        try {
            const crawlPromise = crawlChapterImages(chapterId, chapter.source_url, source, true, true);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_LIMIT')), CRAWL_TIMEOUT));
            crawlResult = await Promise.race([crawlPromise, timeoutPromise]);
        } catch (err) {
            errorStatus = err.code || err.message;
            console.error(`[TITAN WARN] JIT Phase failed: ${errorStatus}`);
        }

        // Verification
        const imgCheck = await query('SELECT COUNT(*) as count FROM chapterimages WHERE chapter_id = @id', { id: chapterId });
        const finalCount = parseInt(imgCheck.recordset[0].count);

        const duration = Date.now() - startTime;

        if (finalCount > 0) {
            return NextResponse.json({ 
                success: true, 
                imageCount: finalCount,
                duration,
                status: errorStatus === 'TIMEOUT_LIMIT' ? 'PARTIAL_SYNC' : 'COMPLETE_SYNC'
            });
        }

        // 503 Critical Failure: Provide telemetry in response for UI troubleshooting
        return NextResponse.json({ 
            error: 'Nguồn ảnh bị chặn hoặc không phản hồi. Đang thử kích hoạt Aegis Auto-Repair...',
            telemetry: {
                chapterId,
                source,
                error: errorStatus,
                elapsed: duration,
                attempts: 1
            }
        }, { status: 503 });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
