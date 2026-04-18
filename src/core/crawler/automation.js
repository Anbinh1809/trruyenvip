import { query, loadSystemState, saveSystemState } from '../database/connection.js';
import { runTitanWorker } from './engine.js';

const PULSE_INTERVAL_MS = 1000 * 60 * 5; // 5 Minutes (User Request)
let isPulseActive = false;

/**
 * Checks if a crawler pulse is needed and executes it if so.
 * Safe to call from high-frequency API routes as it throttled internally.
 */
export async function checkAndPulse() {
    if (isPulseActive) {
        console.log('[Titan:Auto] Pulse already in progress. Skipping...');
        return;
    }

    try {
        const lastPulseAt = await loadSystemState('crawler_last_pulse_at');
        const now = Date.now();

        if (!lastPulseAt || (now - lastPulseAt > PULSE_INTERVAL_MS)) {
            console.log('[Titan:Auto] Heartbeat detected. Initiating autonomous pulse...');
            isPulseActive = true;
            
            // Non-blocking pulse execution with cleanup
            runTitanWorker(true)
                .catch(e => console.error('[Titan:Auto] Pulse failed:', e.message))
                .finally(() => {
                    isPulseActive = false;
                });
            
            // Update state immediately to throttle
            await saveSystemState('crawler_last_pulse_at', now);
        }
    } catch (err) {
        console.warn('[Titan:Auto] Automation check failed:', err.message);
        isPulseActive = false;
    }
}
