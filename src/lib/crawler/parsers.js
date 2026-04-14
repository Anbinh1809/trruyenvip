/**
 * Titan Crawler Parsers
 */
import * as cheerio from 'cheerio';

export function parseNetTruyenManga(html) {
    const $ = cheerio.load(html);
    const title = $('#item-detail .title-detail').text().trim();
    const cover = $('#item-detail .col-image img').attr('src') || $('.detail-info img').attr('src');
    
    // Logic extracted from original crawler.js
    let author = $('.list-info li:contains("Tac gia")').text().replace('Tac gia', '').trim();
    if (!author) author = $('.author .col-xs-8').text().trim();
    
    let status = $('.list-info li:contains("Tinh trang")').text().replace('Tinh trang', '').trim();
    if (!status) status = $('.status .col-xs-8').text().trim();
    
    const description = $('.detail-content p').text().trim();
    const lastChapNum = $('.list-chapter li:first-child a').text().match(/Chap ([\d.]+)/)?.[1] || '0';
    
    const genres = [];
    $('.list-info li:contains("The loai") a').each((i, el) => {
        genres.push($(el).text().trim());
    });

    return { title, cover, author, status, description, lastChapNum, genres };
}

export function parseTruyenQQManga(html) {
    const $ = cheerio.load(html);
    const title = $('.book_info h1').text().trim();
    const cover = $('.book_info .book_avatar img').attr('src');
    const author = $('.book_info li:contains("Tac gia")').text().replace('Tac gia', '').trim();
    const description = $('.book_detail .detail-content').text().trim();
    
    const genres = [];
    $('.list01 li a').each((i, el) => {
        genres.push($(el).text().trim());
    });

    return { title, cover, author, description, genres };
}

export function parseChapterImages(html, source) {
    const $ = cheerio.load(html);
    const images = [];
    
    if (source === 'nettruyen') {
        $('.page-chapter img').each((i, el) => {
            const src = $(el).attr('data-original') || $(el).attr('src');
            if (src && !src.includes('proxy')) images.push(src);
        });
    } else if (source === 'truyenqq') {
        $('.story-see-content img').each((i, el) => {
            const src = $(el).attr('data-original') || $(el).attr('src');
            if (src) images.push(src);
        });
    }
    
    return images;
}
