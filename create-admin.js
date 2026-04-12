import { query } from './src/lib/db.js';
import bcrypt from 'bcryptjs';

async function createAdmin() {
    const password_hash = await bcrypt.hash('password123', 10);
    try {
        await query(`
            IF NOT EXISTS (SELECT * FROM Users WHERE username = 'admin')
            INSERT INTO Users (uuid, username, password_hash, role, vipCoins, xp)
            VALUES ('admin-dev-device', 'admin', @hash, 'admin', 999999, 50000)
        `, { hash: password_hash });
        console.log('Admin account (admin / password123) created successfully.');
    } catch (e) {
        console.error('Error creating admin:', e.message);
    }
}

createAdmin();
