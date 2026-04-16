/**
 * Titan Crawler Parsers
 */
import * as cheerio from 'cheerio';

function sanitize(text) {
    if (!text) return '';
    return text.trim()
        .replace(/\?\?/g, '') // Remove legacy encoding artifacts
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove non-printable control characters
        .replace(/\u200B/g, '') // Remove zero-width space
        .replace(/\s+/g, ' ');
}

function resolveUrl(relative, base) {
    if (!relative) return '';
    if (relative.startsWith('http')) return relative;
    try {
        const baseUrl = new URL(base);
        if (relative.startsWith('//')) return `${baseUrl.protocol}${relative}`;
        if (relative.startsWith('/')) return `${baseUrl.origin}${relative}`;
        return new URL(relative, base).href;
    } catch (e) {
        return relative;
    }
}

export function parseNetTruyenManga(html, sourceUrl) {
    const $ = cheerio.load(html);
    
    // Pattern Matching for Title
    const title = sanitize($('#item-detail .title-detail').text() || $('.detail-info .title').text() || $('h1').first().text());
    
    // Pattern Matching for Cover
    let cover = $('#item-detail .col-image img').attr('src') || 
                $('.detail-info img').attr('src') || 
                $('.book_avatar img').attr('src');
    cover = resolveUrl(cover, sourceUrl);
    
    const getInfoValue = (label) => {
        const entry = $(`.list-info li:contains("${label}")`).first();
        if (!entry.length) return '';
        return sanitize(entry.text().replace(label, ''));
    };

    let author = getInfoValue('Tac gia') || getInfoValue('Tác giả') || sanitize($('.author .col-xs-8').text());
    let status = getInfoValue('Tinh trang') || getInfoValue('Tình trạng') || sanitize($('.status .col-xs-8').text());
    const description = sanitize($('.detail-content p').text() || $('.detail-content').text());
    
    const lastChapEl = $('.list-chapter li:first-child a, #nt_list_chapter .chapter a').first();
    const lastChapNum = lastChapEl.text().match(/(?:Chap|Chapter|Hồi|Chương)\s*([\d.]+)/i)?.[1] || '0';
    
    const genres = [];
    $('.list-info li:contains("The loai") a, .list-info li:contains("Thể loại") a, .kind-list a').each((i, el) => {
        genres.push(sanitize($(el).text()));
    });

    return { title, cover, author, status, description, lastChapNum: lastChapNum.toString(), genres };
}

export function parseTruyenQQManga(html, sourceUrl) {
    const $ = cheerio.load(html);
    const title = sanitize($('.book_info h1').text() || $('.title-detail').text() || $('h1').first().text());
    
    let cover = $('.book_info .book_avatar img').attr('src') || 
                $('.book_info img').attr('src');
    cover = resolveUrl(cover, sourceUrl);
    
    const getInfoValue = (label) => {
        const entry = $(`.book_info li:contains("${label}")`).first();
        if (!entry.length) return '';
        return sanitize(entry.text().replace(label, ''));
    };

    const author = getInfoValue('Tac gia') || getInfoValue('Tác giả') || sanitize($('.author').text());
    const status = getInfoValue('Tinh trang') || getInfoValue('Tình trạng') || sanitize($('.status').text());
    const description = sanitize($('.book_detail .detail-content').text() || $('.detail-content').text());
    
    const genres = [];
    $('.list01 li a, .list-info a').each((i, el) => {
        genres.push(sanitize($(el).text()));
    });

    return { title, cover, author, status, description, genres };
}

export function parseChapterImages(html, sourceName, sourceUrl) {
    const $ = cheerio.load(html);
    const images = new Set();
    
    // BROAD SPECTRUM SCRAPING: Try standard and lazy parents
    const selectors = [
        '.page-chapter img', 
        '.story-see-content img', 
        '#chapter_content img', 
        '.reading-detail img',
        '.container-chapter img'
    ];

    selectors.forEach(sel => {
        $(sel).each((i, el) => {
            const src = $(el).attr('data-original') || 
                       $(el).attr('data-src') || 
                       $(el).attr('data-cdn') || 
                       $(el).attr('src');
            
            // TITAN-GRADE FILTER: Only exclude obvious common UI/AD elements, not pages with "logo" in filename
            const isUIMark = src.includes('/logo/') || src.includes('/banners/') || 
                            src.includes('logo_nettruyen') || src.includes('favicon') ||
                            src.includes('ads_') || src.includes('pixel');
            
            if (src && !isUIMark) {
                images.add(resolveUrl(src, sourceUrl));
            }
        });
    });

    // TITAN BROAD-SPECTRUM FALLBACK (Regex Scan)
    if (images.size === 0) {
        const imgRegex = /https?:\/\/[^"'>\s]+\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"'>\s]*)?/gi;
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
            const src = match[0];
            if (!src.includes('proxy') && !src.includes('logo') && !src.includes('banner')) {
                images.add(resolveUrl(src, sourceUrl));
            }
            // Protective limit: don't loop forever on massive malicious HTML
            if (images.size > 500) break;
        }
    }
    
    return Array.from(images);
}
