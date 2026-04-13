import { queueMangaSync, SOURCES } from '@/lib/crawler';
 
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
 
  try {
    // TITAN ARCHITECTURE: Instead of running the heavy crawl in the HTTP request (timeout risk),
    // we queue it in our background task system.
    import { queueDiscovery } from '@/lib/crawler';
    await queueDiscovery('nettruyen', 3, 10);
    await queueDiscovery('truyenqq', 3, 10);
    
    return Response.json({ 
        success: true, 
        message: 'Cron triggered: Priority discovery queued in background.' 
    }, { status: 200 });
  } catch (error) {
    console.error('[CRON API] Trigger Error:', error.message);
    return Response.json({ 
        error: 'Cron failed to queue task', 
        details: error.message 
    }, { status: 500 });
  }
}
