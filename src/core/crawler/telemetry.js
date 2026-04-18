/**
 * Titan Telemetry & State Management
 */
import { query, saveSystemState } from '../database/connection.js';

global.crawlerState = global.crawlerState || {
    status: 'idle',
    currentManga: null,
    currentMangaTitle: null,
    currentChapter: null,
    currentChapterTitle: null,
    currentImage: null,
    discoveryPage: 1,
    isArchivalPulse: false,
    successCount: 0,
    failCount: 0,
    imagesScrapedToday: 0,
    activeWorkers: 0,
    concurrencyLimit: 128,
    startTime: Date.now(),
    lastAction: Date.now(),
    mirrorHealth: {}, // { 'nettruyen.com': { failCount: 0, lastFail: Date.now(), status: 'ok' } },
    mirrorScores: {}
};

export const getTelemetry = () => global.crawlerState;

export function updateMirrorHealth(domain, isSuccess, error = '') {
    if (!domain) return;
    const health = global.crawlerState.mirrorHealth[domain] || { failCount: 0, lastFail: null, status: 'ok' };
    
    if (isSuccess) {
        health.failCount = 0;
        health.status = 'ok';
    } else {
        health.failCount++;
        health.lastFail = Date.now();
        health.lastError = error;
        if (health.failCount >= 5) health.status = 'degraded';
        if (health.failCount >= 20) health.status = 'offline';
    }
    
    global.crawlerState.mirrorHealth[domain] = health;
    
    // TITAN PERSISTENCE: Trigger a sync if health status just changed
    if (health.status !== 'ok') {
        updateTelemetry({ syncHealth: true });
    }
}

export function updateTelemetry(data) {
    if (!data) return;
    
    // reset stats on new session start
    if (data.status && data.status !== 'idle' && global.crawlerState.status === 'idle') {
        global.crawlerState.startTime = Date.now();
        global.crawlerState.successCount = 0;
        global.crawlerState.failCount = 0;
    }

    if (data.status) global.crawlerState.status = data.status;
    if (data.currentManga !== undefined) global.crawlerState.currentManga = data.currentManga;
    if (data.currentMangaTitle !== undefined) global.crawlerState.currentMangaTitle = data.currentMangaTitle;
    if (data.currentChapter !== undefined) global.crawlerState.currentChapter = data.currentChapter;
    if (data.currentChapterTitle !== undefined) global.crawlerState.currentChapterTitle = data.currentChapterTitle;
    if (data.currentImage !== undefined) global.crawlerState.currentImage = data.currentImage;
    if (data.successCount !== undefined) global.crawlerState.successCount = (global.crawlerState.successCount || 0) + data.successCount;
    if (data.failCount !== undefined) global.crawlerState.failCount = (global.crawlerState.failCount || 0) + data.failCount;
    
    if (data.imagesFound) {
        global.crawlerState.imagesScrapedToday = (global.crawlerState.imagesScrapedToday || 0) + data.imagesFound;
    }

    if (data.activeWorkers !== undefined) global.crawlerState.activeWorkers = data.activeWorkers;
    if (data.concurrencyLimit !== undefined) global.crawlerState.concurrencyLimit = data.concurrencyLimit;

    // SYNC TO DB: Debounced crawler state persistence
    if (data.discoveryPage || data.isArchivalPulse || data.syncHealth) {
        if (data.discoveryPage) global.crawlerState.discoveryPage = data.discoveryPage;
        if (data.isArchivalPulse !== undefined) global.crawlerState.isArchivalPulse = data.isArchivalPulse;
        
        const now = Date.now();
        // TITAN-GRADE SYNC: Sync every 60s OR if forced (syncHealth)
        if (data.syncHealth || now - (global.lastStateSync || 0) > 60000) {
            global.lastStateSync = now;
            saveSystemState('crawler_state', {
                discoveryPage: global.crawlerState.discoveryPage,
                isArchivalPulse: global.crawlerState.isArchivalPulse,
                mirrorHealth: global.crawlerState.mirrorHealth,
                mirrorScores: global.mirrorScores,
                lastSeen: now
            });
            if (data.syncHealth) console.log('[Telemetry] Force-Sync completed.');
        }
    }
    
    global.crawlerState.lastAction = Date.now();
}

/**
 * Logs events to the Guardian database
 */
export async function logGuardianEvent(mangaId, chapterTitle, eventType, message) {
    try {
        let cover = '';
        let mangaName = 'System';
        
        if (mangaId) {
            const res = await query('SELECT title, cover FROM manga WHERE id = @mangaId LIMIT 1', { mangaId });
            const manga = res.recordset?.[0];
            if (manga) {
                mangaName = manga.title;
                cover = manga.cover;
            }
        }

        await query(`
            INSERT INTO guardianreports (manga_name, chapter_title, event_type, message, cover, created_at)
            VALUES (@name, @chap, @type, @msg, @cover, NOW())
        `, {
            name: mangaName,
            chap: chapterTitle || 'System',
            type: eventType,
            msg: message,
            cover: cover || ''
        });
        
        console.log(`[Aegis:SYNC] ${eventType}: ${message}`);
    } catch (e) {
        console.error('[Guardian] Failed to log event:', e.message);
    }
}
