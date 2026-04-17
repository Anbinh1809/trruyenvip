import { query } from '@/HeThong/Database/CoSoDuLieu';

export async function GET(request, { params }) {
    const { chapterId } = await params;

    if (!chapterId) {
        return new Response('Missing chapterId', { status: 400 });
    }

    try {
        const res = await query(`
            SELECT image_url 
            FROM ChapterImages 
            WHERE chapter_id = @chapterId 
            ORDER BY [order] ASC
        `, { chapterId });
        
        const images = res.recordset.map(img => `/api/proxy?url=${encodeURIComponent(img.image_url)}`);
        
        return Response.json(images);
    } catch (err) {
        return new Response('Database error', { status: 500 });
    }
}
