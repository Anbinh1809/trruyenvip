import axios from 'axios';

const CRON_URL = process.env.CRON_URL || 'http://localhost:3000/api/cron';
const INTERVAL = 1 * 60 * 1000; // 1 minute (Titan Heartbeat)

console.log(`[Worker] Automation started. Targeting: ${CRON_URL}`);
console.log(`[Worker] Interval: ${INTERVAL / 1000 / 60} minutes`);

async function triggerCrawl() {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] --- Triggering Crawl ---`);
    
    try {
        const response = await axios.get(CRON_URL, { 
            timeout: 600000,
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET || 'truyenvip_default_cron_secret'}`
            }
        }); // 10 min timeout
        console.log(`[${timestamp}] Response: ${response.data}`);
    } catch (error) {
        console.error(`[${timestamp}] Error: ${error.message}`);
        
        // Retry logic for connection reset/refused
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
            console.log('Server might be restarting, retrying in 30 seconds...');
            setTimeout(triggerCrawl, 30000);
            return;
        }
    }
}

// Initial run
triggerCrawl();

// Persistent loop
setInterval(triggerCrawl, INTERVAL);
