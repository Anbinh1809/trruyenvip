import { query } from '../lib/db.js';

async function repair() {
    console.log('--- TITAN EMERGENCY REPAIR: RESTORING RELATIONS ---');
    try {
        // 1. Notifications
        await query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_uuid VARCHAR(255) NOT NULL,
                manga_id VARCHAR(255),
                title VARCHAR(255),
                message TEXT,
                type VARCHAR(50),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        console.log('✅ notifications table restored');

        // 2. System Config
        await query(`
            CREATE TABLE IF NOT EXISTS system_config (
                key VARCHAR(255) PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        console.log('✅ system_config table restored');

        console.log('--- REPAIR COMPLETE ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ REPAIR FAILED:', err);
        process.exit(1);
    }
}

repair();
