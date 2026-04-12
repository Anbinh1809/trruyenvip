import { crawlLatest } from '@/lib/crawler';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await crawlLatest();
    return new Response('Crawler started successfully', { status: 200 });
  } catch (error) {
    console.error('Cron error:', error.message);
    return new Response('Crawler failed', { status: 500 });
  }
}
