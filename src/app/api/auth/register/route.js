import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken, setSessionCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { username, password, email, uuid, xp = 0, vipCoins = 0 } = await request.json();

        if (!username || !password || !uuid) {
            return NextResponse.json({ error: 'Thiếu thông tin đăng ký' }, { status: 400 });
        }

        // --- GATEKEEPER VALIDATION: Infiltration Shield ---
        // Allow Vietnamese characters, alphanumeric and underscore. Strip HTML.
        const cleanUsername = username.replace(/<[^>]*>?/gm, '').trim();
        const isValidUsername = /^[a-zA-Z0-9_\u00C0-\u1EF9\s]+$/.test(cleanUsername);

        if (!isValidUsername || cleanUsername.length < 3) {
            return NextResponse.json({ error: 'Tên đăng nhập không hợp lệ hoặc quá ngắn (tối thiểu 3 ký tự, không dùng ký tự đặc biệt)' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
             return NextResponse.json({ error: 'Email không đúng định dạng' }, { status: 400 });
        }

        const cleanEmail = email ? email.trim().toLowerCase() : null;

        // Hash password (Hardened: 10 salt rounds)
        const password_hash = await bcrypt.hash(password, 10);

        // Create user (Hardened: Atomic insertion with unique violation catch)
        try {
            await query(`
                INSERT INTO Users (uuid, username, email, password_hash, xp, vipCoins, role)
                VALUES (@uuid, @username, @email, @password_hash, 0, 0, 'user')
            `, {
                uuid: uuid,
                username: cleanUsername,
                email: cleanEmail,
                password_hash
            });
        } catch (dbErr) {
            // Error 2627: Unique Constraint Violation (MSSQL)
            // Error 23505: Unique Violation (PostgreSQL)
            if (dbErr.number === 2627 || dbErr.code === '23505' || dbErr.message.includes('unique constraint')) {
                return NextResponse.json({ error: 'Tên đăng nhập, Email hoặc Thiết bị này đã được sử dụng.' }, { status: 400 });
            }
            throw dbErr; // Rethrow other DB errors to the main catch block
        }

        // Sign token
        const token = await signToken({ uuid, username: cleanUsername, role: 'user' });
        await setSessionCookie(token);

        return NextResponse.json({
            message: 'Đăng ký thành công',
            user: { username: cleanUsername, uuid, xp: 0, vipCoins: 0, role: 'user' }
        });

    } catch (e) {
        console.error('Registration error', e);
        return NextResponse.json({ error: 'Lỗi hệ thống khi đăng ký' }, { status: 500 });
    }
}
