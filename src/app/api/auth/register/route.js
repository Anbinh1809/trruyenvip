import { query, checkRateLimit } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken, setSessionCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { username, password, email, uuid } = await request.json();
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        // 1. Rate Limit: 5 registrations / 1 hour
        const limiter = await checkRateLimit(`register_${ip}`, 5, 3600);
        if (!limiter.success) {
            return NextResponse.json({ 
                error: 'Bạn đã đăng ký quá nhiều tài khoản. Vui lòng quay lại sau 1 giờ.' 
            }, { status: 429 });
        }

        if (!username || !password || !uuid || typeof uuid !== 'string' || uuid.length < 8) {
            return NextResponse.json({ error: 'Thông tin đăng ký không hợp lệ hoặc thiếu dữ liệu thiết bị' }, { status: 400 });
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
                INSERT INTO users (uuid, username, email, password_hash, xp, vipcoins, role)
                VALUES (@uuid, @username, @email, @password_hash, 0, 0, 'user')
            `, {
                uuid: uuid,
                username: cleanUsername,
                email: cleanEmail,
                password_hash
            });
        } catch (dbErr) {
            // PostgreSQL Error 23505: Unique Violation
            if (dbErr.code === '23505' || dbErr.message.toLowerCase().includes('unique constraint')) {
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
