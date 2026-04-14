import { crawlChapterImages } from '@/lib/crawler';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req) {
  try {
    const session = await getSession();
    // Allow admin OR if in development mode for easy debugging
    const isAdmin = session?.role === 'admin';
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isAdmin && !isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapterId } = await req.json();
    if (!chapterId) return NextResponse.json({ error: 'chapterId is required' }, { status: 400 });

    const chapData = await query('SELECT source_url FROM "Chapters" WHERE id = @id', { id: chapterId });
    if (!chapData.recordset?.[0]) {
      return NextResponse.json({ error: 'Chapter not found in database' }, { status: 404 });
    }

    const chap = chapData.recordset[0];
    const source = chap.source_url.includes('nettruyen') ? 'nettruyen' : 'truyenqq';

    // Force deletion of old images to trigger fresh crawl
    await query('DELETE FROM "ChapterImages" WHERE chapter_id = @id', { id: chapterId });
    
    console.log(`[AdminCrawl] Manually triggering crawl for: ${chapterId}`);
    await crawlChapterImages(chapterId, chap.source_url, source);

    const newImgs = await query('SELECT COUNT(*) as count FROM "ChapterImages" WHERE chapter_id = @id', { id: chapterId });
    const count = newImgs.recordset?.[0]?.count || 0;
    
    return NextResponse.json({ 
        success: true, 
        count: count,
        message: `Đã cào xong ${count} ảnh.` 
    });
  } catch (err) {
    console.error('Manual Crawl Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
