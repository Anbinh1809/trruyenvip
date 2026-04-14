import { query, checkRateLimit } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken, setSessionCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const startTime = Date.now();
    try {
        const { username, password } = await request.json();
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        // 1. Rate Limit: 10 attempts / 1 minute
        const limiter = await checkRateLimit(`login_${ip}`, 10, 60);
        if (!limiter.success) {
            return NextResponse.json({ 
                error: 'Quá nhiều lần thử. Vui lòng quay lại sau ít phút.',
                reset: limiter.reset
            }, { status: 429 });
        }

        if (!username || !password) {
            return NextResponse.json({ error: 'Thiếu thông tin đăng nhập' }, { status: 400 });
        }

        // --- LOGIN GUARD ---
        if (username.length > 100 || password.length > 100) {
            return NextResponse.json({ error: 'Thông tin đăng nhập quá dài' }, { status: 400 });
        }

        // Fetch user: Universal login (Username or Email)
        const idLower = username.toString().trim().toLowerCase();
        const res = await query(`
            SELECT * FROM users 
            WHERE LOWER(username) = @id OR LOWER(email) = @id
        `, { id: idLower });
        const user = res.recordset?.[0];

        if (!user) {
            // IRONCLAD DEFENSE: 1s delay to deter brute force
            await new Promise(r => setTimeout(r, 1000));
            return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 400 });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            // IRONCLAD DEFENSE: 1s delay to deter brute force
            await new Promise(r => setTimeout(r, 1000));
            return NextResponse.json({ error: 'Mật khẩu không chính xác' }, { status: 401 });
        }

        // Sign token
        const token = await signToken({ 
            uuid: user.uuid, 
            username: user.username, 
            role: user.role 
        });
        await setSessionCookie(token);

        // TITAN SECURITY: Constant Response Time
        const elapsed = Date.now() - startTime;
        if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));

        return NextResponse.json({
            message: 'Đăng nhập thành công',
            user: { 
                username: user.username, 
                uuid: user.uuid, 
                xp: user.xp, 
                vipCoins: user.vipcoins, 
                role: user.role 
            }
        });

    } catch (e) {
        console.error('Login error', e);
        const elapsed = Date.now() - startTime;
        if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
        return NextResponse.json({ error: 'Lỗi hệ thống khi đăng nhập' }, { status: 500 });
    }
}
