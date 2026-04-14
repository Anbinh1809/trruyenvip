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
    const title = sanitize($('#item-detail .title-detail').text());
    let cover = $('#item-detail .col-image img').attr('src') || $('.detail-info img').attr('src');
    cover = resolveUrl(cover, sourceUrl);
    
    // Fuzzy search for labels
    const getInfoValue = (label) => {
        const entry = $(`.list-info li:contains("${label}")`);
        if (!entry.length) return '';
        return sanitize(entry.text().replace(label, ''));
    };

    let author = getInfoValue('Tac gia') || getInfoValue('Tác giả');
    if (!author) author = sanitize($('.author .col-xs-8').text());
    
    let status = getInfoValue('Tinh trang') || getInfoValue('Tình trạng');
    if (!status) status = sanitize($('.status .col-xs-8').text());
    
    const description = sanitize($('.detail-content p').text());
    const lastChapNum = $('.list-chapter li:first-child a').text().match(/(?:Chap|Chapter|Hồi|Chương)\s*([\d.]+)/i)?.[1] || '0';
    
    const genres = [];
    $('.list-info li:contains("The loai") a, .list-info li:contains("Thể loại") a').each((i, el) => {
        genres.push(sanitize($(el).text()));
    });

    return { title, cover, author, status, description, lastChapNum: lastChapNum.toString(), genres };
}

export function parseTruyenQQManga(html, sourceUrl) {
    const $ = cheerio.load(html);
    const title = sanitize($('.book_info h1').text());
    let cover = $('.book_info .book_avatar img').attr('src');
    cover = resolveUrl(cover, sourceUrl);
    
    const getInfoValue = (label) => {
        const entry = $(`.book_info li:contains("${label}")`);
        if (!entry.length) return '';
        return sanitize(entry.text().replace(label, ''));
    };

    const author = getInfoValue('Tac gia') || getInfoValue('Tác giả') || sanitize($('.author .col-xs-8').text());
    const status = getInfoValue('Tinh trang') || getInfoValue('Tình trạng');
    const description = sanitize($('.book_detail .detail-content').text());
    
    const genres = [];
    $('.list01 li a').each((i, el) => {
        genres.push(sanitize($(el).text()));
    });

    return { title, cover, author, status, description, genres };
}

export function parseChapterImages(html, sourceName, sourceUrl) {
    const $ = cheerio.load(html);
    const images = new Set();
    
    if (sourceName === 'nettruyen') {
        $('.page-chapter img').each((i, el) => {
            const src = $(el).attr('data-original') || $(el).attr('src');
            if (src && !src.includes('proxy') && !src.includes('logo')) {
                images.add(resolveUrl(src, sourceUrl));
            }
        });
    } else if (sourceName === 'truyenqq') {
        $('.story-see-content img').each((i, el) => {
            const src = $(el).attr('data-original') || $(el).attr('src');
            if (src) {
                images.add(resolveUrl(src, sourceUrl));
            }
        });
    }
    
    return Array.from(images);
}
