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

                // 4. Autonomous Guardian disabled — runGuardianAutopilot is not active.
                // The queue processor (processQueue) will continue handling tasks via bootstrapCrawler.
                console.log('[Guardian] Autopilot disabled. Queue-based processing is active.');
            })
            .catch((err) => {
                console.error('[Instrumentation] Critical Initialization Failure:', err.message);
            });
    }
}
