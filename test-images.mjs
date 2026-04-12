import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    const url = 'https://nettruyen.work/truyen-tranh/ngoi-nha-chi-co-me/chuong-0';
    try {
        const response = await axios.get(url, { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://nettruyen.work'
            } 
        });
        const $ = cheerio.load(response.data);
        const imgElements = $('.page-chapter img, .reading-detail .page-chapter img, #chapter_content img');
        console.log(`Found ${imgElements.length} images`);
        
        imgElements.each((i, el) => {
            const imgUrl = $(el).attr('data-src') || $(el).attr('data-original') || $(el).attr('src');
            console.log(`Image ${i}: ${imgUrl}`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
