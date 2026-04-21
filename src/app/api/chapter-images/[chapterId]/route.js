import { query } from '@/core/database/connection';
import { generateProxySignature } from '@/core/security/crypto';

export async function GET(request, { params }) {
    const { chapterId } = await params;

    if (!chapterId) {
        return new Response('Missing chapterId', { status: 400 });
    }

    try {
        const res = await query(`
            SELECT image_url 
            FROM chapterimages 
            WHERE chapter_id = @chapterId 
            ORDER BY [order] ASC
        `, { chapterId });
        
        // Sign each image URL so the proxy accepts it
        const images = res.recordset.map(img => {
            const url = img.image_url;
            const w = 1200;
            const q = 80;
            const sig = generateProxySignature(url, w, q);
            return `/api/proxy?url=${encodeURIComponent(url)}&w=${w}&q=${q}&sig=${sig}`;
        });
        
        return Response.json(images);
    } catch (err) {
        console.error('[chapter-images] DB error:', err.message);
        return new Response('database error', { status: 500 });
    }
}
