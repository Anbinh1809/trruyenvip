export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const globalRef = global;
        if (globalRef.guardianInitialized) {
            console.log('--- [Guardian] Already Initialized. Skipping. ---');
            return;
        }
        globalRef.guardianInitialized = true;

        console.log('--- [Guardian] Initializing Autonomous Engine (V8 Clean) ---');

        // relative import without alias to avoid Turbopack resolution bugs
        import('./lib/crawler/index.js')
            .then((m) => {
                if (m && m.bootstrapCrawler) m.bootstrapCrawler().catch(() => {});
                
                // AUTOMATED MAINTENANCE: Purge logs older than 7 days
                const rotateLogs = async () => {
                   try {
                       const { query } = await import('./lib/db');
                       const result = await query("DELETE FROM CrawlLogs WHERE created_at < NOW() - INTERVAL '7 days'");
                       if (result.rowsAffected[0] > 0) {
                           console.log(`[Guardian] Maintenance: Purged ${result.rowsAffected[0]} old logs.`);
                       }
                   } catch (e) {
                       console.error('[Guardian] Maintenance failed:', e.message);
                   }
                };
                
                rotateLogs(); // Initial purge
                setInterval(rotateLogs, 86400000); // Daily purge
                
                // DATA APOTHEOSIS: Self-Healing Search Index
                const healData = async () => {
                   try {
                       const { query } = await import('./lib/db');
                       const { normalizeTitle } = await import('./lib/crawler/index.js');
                       const missing = await query("SELECT id, title FROM Manga WHERE normalized_title IS NULL LIMIT 50");
                       
                       if (missing.recordset.length > 0) {
                           console.log(`[Guardian] Data Apotheosis: Healing ${missing.recordset.length} titles...`);
                           for (const manga of missing.recordset) {
                               const normalized = normalizeTitle(manga.title);
                               await query("UPDATE Manga SET normalized_title = @normalized WHERE id = @id", { 
                                   normalized, 
                                   id: manga.id 
                               });
                           }
                           console.log(`[Guardian] Data Apotheosis: Complete.`);
                       }
                   } catch (e) {
                       console.error('[Guardian] Data Apotheosis failed:', e.message);
                   }
                };

                healData(); // Initial heal
                setInterval(healData, 86400000); // Daily heal

                if (m && m.runGuardianAutopilot) {
                    setTimeout(() => {
                        m.runGuardianAutopilot().catch(err => {
                            console.error('[Instrumentation] Guardian Autopilot failed:', err.message);
                        });
                    }, 5000);
                }
            })
            .catch((err) => {
                console.error('[Instrumentation] Critical Crawler Import Failure:', err.message);
            });
    }
}
