import { queueDiscovery } from '@/core/crawler';
import { runFullMaintenance } from '@/core/database/maintenance';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET || 'truyenvip_default_cron_secret';
  
  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
 
  try {
    // 1. PERFORM SYSTEM MAINTENANCE FIRST (Unified Titan Engine)
    await runFullMaintenance();

    // 2. TITAN ARCHITECTURE: Queue heavy discovery tasks
    // Page 1 is always the latest updates
    await queueDiscovery('nettruyen', 3, 1, 10);
    await queueDiscovery('truyenqq', 3, 1, 10);
    
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

