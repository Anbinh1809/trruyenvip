/**
 * TITAN INSTRUMENTATION HOOK
 * Next.js tự động gọi file này một lần khi server khởi động.
 * Crawler tự chạy theo lịch ngay khi `npm run dev` hoặc `npm start` được bật.
 * Không cần GitHub Actions.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;

    const globalRef = global;
    if (globalRef.guardianInitialized) {
        console.log('--- [Guardian] Already Initialized. Skipping. ---');
        return;
    }
    globalRef.guardianInitialized = true;

    console.log('--- [Guardian] Initializing Autonomous Engine ---');

    // Dùng IIFE async để không block Next.js startup
    (async () => {
        try {
            const { query } = await import('./core/database/connection.js');
            const { bootstrapCrawler, queueDiscovery, runTitanWorker } = await import('./core/crawler/index.js');
            const { runFullMaintenance } = await import('./core/database/maintenance.js');
            const { default: cron } = await import('node-cron');

            // 1. Bootstrap: dọn task bị treo, khởi động processQueue
            await bootstrapCrawler().catch(e => console.error('[Guardian] Bootstrap failed:', e.message));

            // 2. Seed lần đầu nếu queue rỗng
            const pendingRes = await query("SELECT COUNT(*) as cnt FROM crawlertasks WHERE status = 'pending'").catch(() => null);
            const hasPendingTasks = parseInt(pendingRes?.recordset?.[0]?.cnt || 0) > 0;
            if (!hasPendingTasks) {
                console.log('[Guardian] Queue empty — seeding initial discovery tasks...');
                await queueDiscovery('nettruyen', 5, 1, 10).catch(e => console.error('[Guardian] Seed nettruyen failed:', e.message));
                await queueDiscovery('truyenqq', 3, 1, 10).catch(e => console.error('[Guardian] Seed truyenqq failed:', e.message));
            }

            // 3. Guard: tránh chạy 2 pulse cùng lúc
            let isRunning = false;
            const runPulse = async (mode = 'light') => {
                if (isRunning) { console.log(`[Cron] ${mode} pulse skipped — previous still running.`); return; }
                isRunning = true;
                console.log(`[Cron] ⚡ ${mode.toUpperCase()} pulse starting...`);
                try {
                    await runTitanWorker(true, mode);
                    console.log(`[Cron] ✅ ${mode.toUpperCase()} pulse done.`);
                } catch (err) {
                    if (err.message?.includes('ALL_MIRRORS_FAILED') || err.message?.includes('ECONNREFUSED')) {
                        console.warn('[Cron] Mirror unreachable — skipped gracefully.');
                    } else {
                        console.error('[Cron] ❌ Error:', err.message);
                    }
                } finally {
                    isRunning = false;
                }
            };

            // 4. Lịch chạy (Asia/Ho_Chi_Minh)
            // - Light pulse mỗi 4 giờ: cào truyện mới nhất (~3 phút CPU)
            cron.schedule('0 */4 * * *', () => runPulse('light'), { timezone: 'Asia/Ho_Chi_Minh' });
            // - Deep archival lúc 2:00 SA: vá lỗ hổng + rescue ảnh hỏng (~8 phút CPU)
            cron.schedule('0 2 * * *', () => runPulse('deep'), { timezone: 'Asia/Ho_Chi_Minh' });
            // - Bảo trì DB lúc 3:00 SA: dọn log cũ, tối ưu index
            cron.schedule('0 3 * * *', () => runFullMaintenance().catch(e => console.error('[Cron] Maintenance error:', e.message)), { timezone: 'Asia/Ho_Chi_Minh' });

            // 5. Disabled auto-pulse to avoid startup OOM/Hangs
            // runPulse('light').catch(() => {});

            console.log('[Guardian] 🚀 Titan Crawler Scheduler ACTIVATED.');
            console.log('[Guardian]    ⚡ Light pulse  : every 4 hours');
            console.log('[Guardian]    🔍 Deep archival: daily at 02:00 AM (VNT)');
            console.log('[Guardian]    🛠  Maintenance  : daily at 03:00 AM (VNT)');

        } catch (err) {
            console.error('[Instrumentation] Critical Initialization Failure:', err.message);
        }
    })();
}
