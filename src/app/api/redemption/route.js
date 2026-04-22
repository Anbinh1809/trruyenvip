import { query, withTransaction, checkRateLimit } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const GET = withTitan({
    auth: true,
    handler: async (req, session) => {
        try {
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
        } catch (e) {
            console.error('Redemption GET error:', e);
            throw e;
        }
    }
});

export const POST = withTitan({
    auth: true,
    handler: async (req, session) => {
        try {
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
                    'UPDATE users SET [vipCoins] = [vipCoins] - @cost WHERE uuid = @uuid AND [vipCoins] >= @cost',
                    { cost, uuid: session.uuid },
                    client
                );
     
                if (updateRes.rowCount === 0) {
                    const userRes = await query('SELECT [vipCoins] FROM users WHERE uuid = @uuid', { uuid: session.uuid }, client);
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
        } catch (e) {
            console.error('Redemption POST error:', e);
            throw e;
        }
    }
});

export const PATCH = withTitan({
    admin: true,
    handler: async (req) => {
        try {
            const { id, status } = await req.json();

            if (!['Pending', 'Done', 'Rejected'].includes(status)) {
                throw { status: 400, message: 'Trạng thái không hợp lệ' };
            }

            const parsedId = parseInt(id);

            // M1 FIX: Refund VipCoins when rejecting a redemption request
            if (status === 'Rejected') {
                await withTransaction(async (tx) => {
                    const reqRes = await query(
                        'SELECT user_uuid, card_value, status as current_status FROM redemptionrequests WHERE id = @id',
                        { id: parsedId }, tx
                    );
                    const record = reqRes.recordset?.[0];
                    if (!record) throw { status: 404, message: 'Không tìm thấy bản ghi' };
                    if (record.current_status === 'Rejected') throw { status: 400, message: 'Bản ghi này đã bị từ chối trước đó' };

                    // Refund coins (card_value * 1000 is the original cost)
                    const refundAmount = (record.card_value || 0) * 1000;
                    await query('UPDATE users SET [vipCoins] = [vipCoins] + @refund WHERE uuid = @uuid',
                        { refund: refundAmount, uuid: record.user_uuid }, tx
                    );
                    await query('UPDATE redemptionrequests SET status = @status WHERE id = @id',
                        { status, id: parsedId }, tx
                    );
                });
                return { success: true, message: 'Đã từ chối và hoàn tiền cho người dùng' };
            }

            const res = await query(`UPDATE redemptionrequests SET status = @status WHERE id = @id`, { 
                id: parsedId, 
                status 
            });
            
            if (res.rowCount === 0) {
                throw { status: 404, message: 'Không tìm thấy bản ghi' };
            }

            return { success: true, message: 'Updated' };
        } catch (e) {
            console.error('Redemption PATCH error:', e);
            throw e;
        }
    }
});


