import { queueDiscovery } from '@/lib/crawler';
import { runMaintenance } from '@/lib/maintenance';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
 
  try {
    // 1. PERFORM SYSTEM MAINTENANCE FIRST
    // This keeps the Neon DB lean by pruning old logs, orphans, and stuck tasks.
    const maintenance = await runMaintenance();

    // 2. TITAN ARCHITECTURE: Queue heavy discovery tasks
    await queueDiscovery('nettruyen', 3, 10);
    await queueDiscovery('truyenqq', 3, 10);
    
    return Response.json({ 
        success: true, 
        message: 'Cron triggered: Maintenance complete and tasks queued.',
        maintenance: maintenance.results
    }, { status: 200 });
  } catch (error) {
    console.error('[CRON API] Trigger Error:', error.message);
    return Response.json({ 
        error: 'Cron failed to queue task', 
        details: error.message 
    }, { status: 500 });
  }
}
