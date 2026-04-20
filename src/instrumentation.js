export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const globalRef = global;
        if (globalRef.guardianInitialized) {
            console.log('--- [Guardian] Already Initialized. Skipping. ---');
            return;
        }
        globalRef.guardianInitialized = true;

        console.log('--- [Guardian] Initializing Autonomous Engine (Industrial Path) ---');

        import('./core/crawler/index.js')
            .then(async (m) => {
                const { query } = await import('./core/database/connection.js');

                // 1. Initial System Bootstrap
                if (m && m.bootstrapCrawler) {
                    await m.bootstrapCrawler().catch(e => console.error('[Guardian] Bootstrap failed:', e.message));
                }
                
                // 2. Automated Centralized Maintenance
                const { runFullMaintenance } = await import('./core/database/maintenance.js');
                
                // Trigger Initial Maintenance Cycle
                runFullMaintenance().catch(e => console.error('[Guardian] Maintenance boot error:', e.message));
                
                // Set Maintenance Intervals
                setInterval(runFullMaintenance, 86400000); // 24h Full Cycle

                // 4. Seed discovery tasks if queue is completely empty (fresh start)
                const pendingCount = await query("SELECT COUNT(*) as cnt FROM crawlertasks WHERE status = 'pending'");
                const hasPendingTasks = parseInt(pendingCount.recordset?.[0]?.cnt || 0) > 0;

                if (!hasPendingTasks) {
                    console.log('[Guardian] Queue empty. Seeding initial discovery tasks...');
                    const { queueDiscovery } = await import('./core/crawler/index.js');
                    await queueDiscovery('nettruyen', 5, 1, 10).catch(e => console.error('[Guardian] Seed nettruyen failed:', e.message));
                    await queueDiscovery('truyenqq', 3, 1, 10).catch(e => console.error('[Guardian] Seed truyenqq failed:', e.message));
                }

                // 5. Activate Guardian Autopilot for continuous background sync
                const { runGuardianAutopilot } = await import('./core/crawler/index.js');
                runGuardianAutopilot(false).catch(e => console.error('[Guardian] Autopilot failed:', e.message));
                console.log('[Guardian] Autopilot ACTIVATED. Continuous background sync running.');

            })
            .catch((err) => {
                console.error('[Instrumentation] Critical Initialization Failure:', err.message);
            });
    }
}
