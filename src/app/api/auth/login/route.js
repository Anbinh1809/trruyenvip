import { query, checkRateLimit } from '@/core/database/connection';
import bcrypt from 'bcryptjs';
import { signToken, setSessionCookie } from '@/core/security/auth';
import { withTitan } from '@/core/api/handler';

export const POST = withTitan({
    handler: async (req) => {
        const startTime = Date.now();
        try {
            const { username, password } = await req.json();
            const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

            // 1. Rate Limit: 10 attempts / 1 minute
            const limiter = await checkRateLimit(`login_${ip}`, 10, 60);
            if (!limiter.success) {
                throw { status: 429, message: 'QuÃ¡ nhiá»u láº§n thá»­. Vui lÃ²ng quay láº¡i sau Ã­t phÃºt.' };
            }

            if (!username || !password) {
                throw { status: 400, message: 'Thiáº¿u thÃ´ng tin Ä‘Äƒng nháº­p' };
            }

            // --- LOGIN GUARD ---
            if (username.length > 100 || password.length > 100) {
                throw { status: 400, message: 'ThÃ´ng tin Ä‘Äƒng nháº­p quÃ¡ dÃ i' };
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
                throw { status: 400, message: 'NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i' };
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                // IRONCLAD DEFENSE: 1s delay to deter brute force
                await new Promise(r => setTimeout(r, 1000));
                throw { status: 401, message: 'Máº­t kháº©u khÃ´ng chÃ­nh xÃ¡c' };
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

            return {
                message: 'ÄÄƒng nháº­p thÃ nh cÃ´ng',
                user: { 
                    username: user.username, 
                    uuid: user.uuid, 
                    xp: user.xp, 
                    vipCoins: user.vipcoins, 
                    role: user.role 
                }
            };

        } catch (e) {
            // withTitan will handle the error response if we throw an object with status/message
            if (e.status) throw e;
            
            console.error('Login error', e);
            const elapsed = Date.now() - startTime;
            if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed));
            throw { status: 500, message: 'Lá»—i há»‡ thá»‘ng khi Ä‘Äƒng nháº­p' };
        }
    }
});



