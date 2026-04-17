import { query, checkRateLimit } from '@/HeThong/Database/CoSoDuLieu';
import bcrypt from 'bcryptjs';
import { signToken, setSessionCookie } from '@/HeThong/BaoMat/XacThuc';
import { withTitan } from '@/HeThong/API/XuLyAPI';

export const POST = withTitan({
    handler: async (req) => {
        const startTime = Date.now();
        try {
            const { username, password } = await req.json();
            const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

            // 1. Rate Limit: 10 attempts / 1 minute
            const limiter = await checkRateLimit(`login_${ip}`, 10, 60);
            if (!limiter.success) {
                throw { status: 429, message: 'Quá nhiều lần thử. Vui lòng quay lại sau ít phút.' };
            }

            if (!username || !password) {
                throw { status: 400, message: 'Thiếu thông tin đăng nhập' };
            }

            // --- LOGIN GUARD ---
            if (username.length > 100 || password.length > 100) {
                throw { status: 400, message: 'Thông tin đăng nhập quá dài' };
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
                throw { status: 400, message: 'Người dùng không tồn tại' };
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                // IRONCLAD DEFENSE: 1s delay to deter brute force
                await new Promise(r => setTimeout(r, 1000));
                throw { status: 401, message: 'Mật khẩu không chính xác' };
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
                message: 'Đăng nhập thành công',
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
            throw { status: 500, message: 'Lỗi hệ thống khi đăng nhập' };
        }
    }
});


