const axios = require('axios');
axios.get('https://truyenqq.com.vn/', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36' } })
    .then(r => {
        const m = r.data.match(/href="([^"]+trang-2[^"]*)"/i);
        console.log('Link: ' + (m ? m[1] : 'not found'));
    })
    .catch(console.log);
