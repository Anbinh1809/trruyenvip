import { crawlChapterImages } from '@/lib/crawler';
import { query } from '@/lib/db';
import { withTitan } from '@/lib/api-handler';

// In-memory telemetry for real-time debugging
const jitTelemetry = new Map();

export const runtime = 'nodejs';
export const maxDuration = 55;

export const POST = withTitan({
    handler: async (req, session) => {
        const startTime = Date.now();
        const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'local';
        const rateLimitKey = session ? session.uuid : `guest_${clientIp}`;

        const { chapterId } = await req.json();
        if (!chapterId) {
            throw { status: 400, message: 'Missing chapterId' };
        }

        // Cooldown checks
        const lastSync = jitTelemetry.get(rateLimitKey) || 0;
        const cooldown = session ? 8000 : 25000;
        if (Date.now() - lastSync < cooldown) {
            const remaining = Math.ceil((cooldown - (Date.now() - lastSync)) / 1000);
            throw {  
                status: 429,
                message: `Hệ thống đang xử lý, vui lòng chờ ${remaining}s...`,
                isCooldown: true
            };
        }

        // Fast-path: Check if already exists
        const existing = await query('SELECT COUNT(*) as count FROM chapterimages WHERE chapter_id = @id', { id: chapterId });
        if (parseInt(existing.recordset?.[0]?.count || 0) >= 1) {
            return { success: true, imageCount: existing.recordset[0].count };
        }

        jitTelemetry.set(rateLimitKey, Date.now());

        const chapData = await query("SELECT source_url FROM chapters WHERE id = @id", { id: chapterId });
        if (chapData.recordset.length === 0) {
            throw { status: 404, message: 'Chapter not found' };
        }

        const chapter = chapData.recordset[0];
        const source = chapter.source_url?.includes('nettruyen') ? 'nettruyen' : 'truyenqq';

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
        }

        // Verification
        const imgCheck = await query('SELECT COUNT(*) as count FROM chapterimages WHERE chapter_id = @id', { id: chapterId });
        const finalCount = parseInt(imgCheck.recordset?.[0]?.count || 0);

        const duration = Date.now() - startTime;

        if (finalCount > 0) {
            return { 
                success: true, 
                imageCount: finalCount,
                duration,
                status: errorStatus === 'TIMEOUT_LIMIT' ? 'PARTIAL_SYNC' : 'COMPLETE_SYNC'
            };
        }

        throw {  
            status: 503,
            message: 'Nguồn ảnh bị chặn hoặc không phản hồi. Đang thử kích hoạt Aegis Auto-Repair...',
            telemetry: {
                chapterId,
                source,
                error: errorStatus,
                elapsed: duration,
                attempts: 1
            }
        };
    }
});
