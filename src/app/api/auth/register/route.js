import { query, checkRateLimit } from '@/core/database/connection';
import bcrypt from 'bcryptjs';
import { signToken, setSessionCookie } from '@/core/security/auth';
import { withTitan } from '@/core/api/handler';

export const POST = withTitan({
    handler: async (req) => {
        try {
            const { username, password, email, uuid } = await req.json();
            const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

            // 1. Rate Limit: 5 registrations / 1 hour
            const limiter = await checkRateLimit(`register_${ip}`, 5, 3600);
            if (!limiter.success) {
                throw { status: 429, message: 'Báº¡n Ä‘Ã£ đăng ký quÃ¡ nhiá»u tÃ i khoáº£n. Vui lÃ²ng quay láº¡i sau 1 giá».' };
            }

            if (!username || !password || !uuid || typeof uuid !== 'string' || uuid.length < 8) {
                throw { status: 400, message: 'Thông tin đăng ký không hợp lệ hoáº·c thiếu dữ liệu thiết bị' };
            }

            // --- GATEKEEPER VALIDATION: Infiltration Shield ---
            // Allow Vietnamese characters, alphanumeric and underscore. Strip HTML.
            const cleanUsername = username.replace(/<[^>]*>?/gm, '').trim();
            const isValidUsername = /^[a-zA-Z0-9_\u00C0-\u1EF9\s]+$/.test(cleanUsername);

            if (!isValidUsername || cleanUsername.length < 3) {
                throw { status: 400, message: 'TÃªn đăng nhập không hợp lệ hoáº·c quÃ¡ ngáº¯n (tá»‘i thiá»ƒu 3 ký tự, khÃ´ng dÃ¹ng ký tự đặc biệt)' };
            }

            if (password.length < 6) {
                throw { status: 400, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
            }

            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                 throw { status: 400, message: 'Email khÃ´ng đúng định dạng' };
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
                    throw { status: 400, message: 'TÃªn đăng nhập, Email hoáº·c Thiáº¿t bá»‹ nÃ y Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng.' };
                }
                throw dbErr; // Rethrow other DB errors to the withTitan catch block
            }

            // Sign token
            const token = await signToken({ uuid, username: cleanUsername, role: 'user' });
            await setSessionCookie(token);

            return {
                message: 'ÄÄƒng kÃ½ thành công',
                user: { username: cleanUsername, uuid, xp: 0, vipCoins: 0, role: 'user' }
            };

        } catch (e) {
            if (e.status) throw e;
            console.error('Registration error', e);
            throw { status: 500, message: 'Lỗi hệ thống khi đăng ký' };
        }
    }
});



