import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Tính năng này không được phép trên môi trường thực tế.' }, { status: 403 });
    }
    try {
        const password_hash = await bcrypt.hash('password123', 10);
        
        // Try to create the admin user
        await query(`
            IF NOT EXISTS (SELECT * FROM Users WHERE username = 'admin')
            INSERT INTO Users (uuid, username, password_hash, role, vipCoins, xp)
            VALUES ('admin-dev-device', 'admin', @hash, 'admin', 999999, 50000)
            ELSE
            UPDATE Users SET role = 'admin', password_hash = @hash WHERE username = 'admin'
        `, { hash: password_hash });

        return NextResponse.json({
            success: true,
            message: 'Đã thiết lập tài khoản Admin thành công!',
            credentials: {
                username: 'admin',
                password: 'password123'
            },
            note: 'Nếu bạn đã đăng ký tài khoản khác, hãy đổi role trong DB hoặc đổi tên admin trong script này.'
        });
    } catch (e) {
        console.error('Debug Setup Error:', e);
        return NextResponse.json({
            success: false,
            error: e.message,
            stack: e.stack,
            env_db_user: process.env.DB_USER
        }, { status: 500 });
    }
}
