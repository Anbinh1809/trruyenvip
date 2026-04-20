import { crawlChapterImages } from '@/core/crawler';
import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const POST = withTitan({
  allowOptional: true, // Allow dev access bypass
  handler: async (req, session) => {
    const isAdmin = session?.role === 'admin';
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isAdmin && !isDev) {
      throw Object.assign(new Error('Unauthorized'), { status: 401 });
    }

    const { chapterId } = await req.json();
    if (!chapterId) throw Object.assign(new Error('chapterId is required'), { status: 400 });

    const chapData = await query('SELECT source_url FROM chapters WHERE id = @id', { id: chapterId });
    if (!chapData.recordset?.[0]) {
      throw Object.assign(new Error('Chapter not found in database'), { status: 404 });
    }

    const chap = chapData.recordset[0];
    if (!chap.source_url) throw Object.assign(new Error('Chapter has no source URL'), { status: 400 });
    const source = chap.source_url?.includes('nettruyen') ? 'nettruyen' : 'truyenqq';

    await query('DELETE FROM chapterimages WHERE chapter_id = @id', { id: chapterId });
    await crawlChapterImages(chapterId, chap.source_url, source);

    const newImgs = await query('SELECT COUNT(*) as count FROM chapterimages WHERE chapter_id = @id', { id: chapterId });
    const count = newImgs.recordset?.[0]?.count || 0;
    
    return { 
        success: true, 
        count: count,
        message: `Đã cào xong ${count} ảnh.`
    };
  }
});
