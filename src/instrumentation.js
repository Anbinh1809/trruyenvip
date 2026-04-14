export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const globalRef = global;
        if (globalRef.guardianInitialized) {
            console.log('--- [Guardian] Already Initialized. Skipping. ---');
            return;
        }
        globalRef.guardianInitialized = true;

        console.log('--- [Guardian] Initializing Autonomous Engine (Industrial Path) ---');

        import('./lib/crawler/index.js')
            .then(async (m) => {
                const { query } = await import('./lib/db.js');

                // 1. Initial System Bootstrap
                if (m && m.bootstrapCrawler) {
                    await m.bootstrapCrawler().catch(e => console.error('[Guardian] Bootstrap failed:', e.message));
                }
                
                // 2. Automated Maintenance (Log Rotation)
                const rotateLogs = async () => {
                   try {
                       const result = await query("DELETE FROM crawllogs WHERE created_at < NOW() - INTERVAL '7 days'");
                       if (result.rowCount > 0) {
                           console.log(`[Guardian] Maintenance: Purged ${result.rowCount} old logs.`);
                       }
                   } catch (e) {
                       console.error('[Guardian] Maintenance failed:', e.message);
                   }
                };
                
                // 3. Data Apotheosis (Search Index Healing)
                const healData = async () => {
                   try {
                       const { normalizeTitle } = m;
                       const missing = await query("SELECT id, title FROM manga WHERE normalized_title IS NULL LIMIT 50");
                       
                       if (missing.recordset && missing.recordset.length > 0) {
                           console.log(`[Guardian] Data Apotheosis: Healing ${missing.recordset.length} titles...`);
                           for (const manga of missing.recordset) {
                               const normalized = normalizeTitle(manga.title);
                               await query("UPDATE manga SET normalized_title = @normalized WHERE id = @id", { 
                                   normalized, 
                                   id: manga.id 
                               });
                           }
                       }
                   } catch (e) {
                       console.error('[Guardian] Data Apotheosis failed:', e.message);
                   }
                };

                // Trigger Initial Services
                rotateLogs().catch(() => {});
                healData().catch(() => {});
                
                // Set Maintenance Intervals
                setInterval(rotateLogs, 86400000); 
                setInterval(healData, 3600000); // Check for broken titles every hour

                // 4. Launch Autonomous Guardian
                if (m && m.runGuardianAutopilot) {
                    console.log('[Guardian] Requesting Autopilot Launch Sequence...');
                    setTimeout(() => {
                        m.runGuardianAutopilot().catch(err => {
                            console.error('[Instrumentation] Critical Guardian stall:', err.message);
                        });
                    }, 5000);
                }
            })
            .catch((err) => {
                console.error('[Instrumentation] Critical Initialization Failure:', err.message);
            });
    }
}
