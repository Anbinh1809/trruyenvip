/**
 * Titan Telemetry & State Management
 */
import { query } from '../db.js';

global.crawlerState = global.crawlerState || {
    status: 'idle',
    currentManga: null,
    currentChapter: null,
    currentImage: null,
    discoveryPage: 1,
    isArchivalPulse: false,
    successCount: 0,
    failCount: 0,
    imagesScrapedToday: 0,
    startTime: Date.now(),
    lastAction: Date.now()
};

export const getTelemetry = () => global.crawlerState;

export function updateTelemetry(data) {
    if (!data) return;
    
    if (data.status) global.crawlerState.status = data.status;
    if (data.currentManga !== undefined) global.crawlerState.currentManga = data.currentManga;
    if (data.currentChapter !== undefined) global.crawlerState.currentChapter = data.currentChapter;
    if (data.currentImage !== undefined) global.crawlerState.currentImage = data.currentImage;
    if (data.successCount !== undefined) global.crawlerState.successCount = (global.crawlerState.successCount || 0) + data.successCount;
    if (data.failCount !== undefined) global.crawlerState.failCount = (global.crawlerState.failCount || 0) + data.failCount;
    
    if (data.imagesFound) {
        global.crawlerState.imagesScrapedToday = (global.crawlerState.imagesScrapedToday || 0) + data.imagesFound;
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
