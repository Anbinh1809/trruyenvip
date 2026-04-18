import { query, loadSystemState, saveSystemState } from '../database/connection.js';
import { runTitanWorker } from './engine.js';

const PULSE_INTERVAL_MS = 1000 * 60 * 5; // 5 Minutes (User Request)

/**
 * Checks if a crawler pulse is needed and executes it if so.
 * Safe to call from high-frequency API routes as it throttles internally.
 */
export async function checkAndPulse() {
    try {
        const lastPulseAt = await loadSystemState('crawler_last_pulse_at');
        const now = Date.now();

        if (!lastPulseAt || (now - lastPulseAt > PULSE_INTERVAL_MS)) {
            console.log('[Titan:Auto] Heartbeat detected. Initiating autonomous pulse...');
            // Non-blocking pulse execution
            runTitanWorker(true).catch(e => console.error('[Titan:Auto] Pulse failed:', e.message));
            
            // Update state immediately to throttle
            await saveSystemState('crawler_last_pulse_at', now);
        }
    } catch (err) {
        console.warn('[Titan:Auto] Automation check failed:', err.message);
    }
}
