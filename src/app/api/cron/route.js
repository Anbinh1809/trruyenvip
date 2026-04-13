import { crawlLatest } from '@/lib/crawler';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // TITAN ARCHITECTURE: Instead of running the heavy crawl in the HTTP request (timeout risk),
    // we queue it in our background task system.
    await queueMangaSync('priority_discovery', SOURCES.NETTRUYEN, 'nettruyen', false, 10);
    
    return new Response('Cron triggered: Priority discovery queued in background.', { status: 200 });
  } catch (error) {
    console.error('Cron error:', error.message);
    return new Response(`Cron failed to queue: ${error.message}`, { status: 500 });
  }
}
