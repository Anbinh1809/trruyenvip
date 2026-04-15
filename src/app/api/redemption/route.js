import { query, withTransaction, checkRateLimit } from '@/lib/db';
import { withTitan } from '@/lib/api-handler';

export const GET = withTitan({
    authenticated: true,
    handler: async (req, session) => {
        const { searchParams } = new URL(req.url);
        const userUuid = searchParams.get('userUuid') || session.uuid;

        // Admin: Access all requests
        if (session.role === 'admin') {
            const res = await query(`
                SELECT id, user_uuid, user_name, bank_name, account_no, account_holder, card_value, status, created_at 
                FROM redemptionrequests 
                ORDER BY created_at DESC
            `);
            return res.recordset || [];
        }

        // User: Access only personal history
        if (userUuid !== session.uuid) {
            throw { status: 403, message: 'Forbidden' };
        }

        const res = await query(`
            SELECT id, bank_name, account_no, card_value, status, created_at 
            FROM redemptionrequests 
            WHERE user_uuid = @userUuid 
            ORDER BY created_at DESC
        `, { userUuid });
        
        return res.recordset || [];
    }
});

export const POST = withTitan({
    authenticated: true,
    handler: async (req, session) => {
        const { bankName, accountNo, accountHolder, amount } = await req.json();

        if (!bankName || !accountNo || !accountHolder || !amount) {
            throw { status: 400, message: 'Thiếu thông tin yêu cầu chuyển khoản' };
        }

        const val = parseInt(amount);
        if (val < 10) {
            throw { status: 400, message: 'Số tiền rút tối thiểu là 10.000đ' };
        }
        const cost = val * 1000;

        // TITAN RATE LIMIT: Prevent withdrawal spamming
        const limiter = await checkRateLimit(`redemption_${session.uuid}`, 1, 60); // 1 request / minute
        if (!limiter.success) {
            throw { status: 429, message: 'Yêu cầu của bạn đang được xử lý hoặc quá nhanh. Vui lòng đợi 1 phút.' };
        }

        return await withTransaction(async (client) => {
            // TITAN ATOMICITY: Check and Deduct in one operation to prevent double-spending race conditions
            const updateRes = await query(
                'UPDATE users SET vipcoins = vipcoins - @cost WHERE uuid = @uuid AND vipcoins >= @cost',
                { cost, uuid: session.uuid },
                client
            );
 
            if (updateRes.rowCount === 0) {
                // If update failed, it's either user not found or insufficient balance
                // We re-query only to provide a specific error message, but the safety is in the WHERE clause above.
                const userRes = await query('SELECT vipcoins FROM users WHERE uuid = @uuid', { uuid: session.uuid }, client);
                if (!userRes.recordset?.[0]) throw new Error('Người dùng không tồn tại.');
                throw new Error('Số dư VipCoins không đủ.');
            }

            await query(
                `INSERT INTO redemptionrequests 
                (user_uuid, user_name, bank_name, account_no, account_holder, card_value, status) 
                VALUES (@uuid, @name, @bank, @acc, @holder, @val, @status)`,
                { 
                    uuid: session.uuid, 
                    name: session.username || 'Khách ẩn danh', 
                    bank: bankName, 
                    acc: accountNo, 
                    holder: accountHolder, 
                    val, 
                    status: 'Pending' 
                },
                client
            );

            return { success: true, message: 'Yêu cầu rút tiền đã được gửi thành công!' };
        });
    }
});

export const PATCH = withTitan({
    admin: true,
    handler: async (req) => {
        const { id, status } = await req.json();

        if (!['Pending', 'Done', 'Rejected'].includes(status)) {
            throw { status: 400, message: 'Trạng thái không hợp lệ' };
        }

        const res = await query(`UPDATE redemptionrequests SET status = @status WHERE id = @id`, { 
            id: parseInt(id), 
            status 
        });
        
        if (res.rowCount === 0) {
            throw { status: 404, message: 'Không tìm thấy bản ghi' };
        }

        return { success: true, message: 'Updated' };
    }
});
