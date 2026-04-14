import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Tính năng này không được phép trên môi trường thực tế.' }, { status: 403 });
    }
    try {
        const password_hash = await bcrypt.hash('password123', 10);
        
        // Setup Admin (Postgres-native ON CONFLICT)
        await query(`
            INSERT INTO "Users" (uuid, username, password_hash, role, "vipCoins", xp)
            VALUES ('admin-dev-device', 'admin', @hash, 'admin', 999999, 50000)
            ON CONFLICT (username) DO UPDATE 
            SET role = 'admin', password_hash = EXCLUDED.password_hash;
        `, { hash: password_hash });

        return NextResponse.json({
            success: true,
            message: 'Đã thiết lập tài khoản Admin thành công!',
            credentials: {
                username: 'admin',
                password: 'password123'
            }
        });
    } catch (e) {
        console.error('Debug Setup Error:', e);
        return NextResponse.json({
            success: false,
            error: 'Lỗi thiết lập hệ thống'
        }, { status: 500 });
    }
}
