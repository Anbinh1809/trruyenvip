import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request) {
    const session = await getSession();
    if (!session) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(request.url);
    const userUuid = searchParams.get('userUuid') || session.uuid;

    // DB-First Identity Check
    const userRes = await query('SELECT role, uuid FROM "Users" WHERE uuid = @uuid', { uuid: session.uuid });
    const userIdent = userRes.recordset?.[0];
    if (!userIdent) return new Response('User not found', { status: 404 });

    // Admin access: See all requests with full bank details
    if (userIdent.role === 'admin') {
        try {
            const res = await query(`
                SELECT id, user_uuid, user_name, bank_name, account_no, account_holder, card_value, status, created_at 
                FROM redemptionrequests 
                ORDER BY created_at DESC
            `);
            return Response.json(res.recordset || []);
        } catch (err) {
            return new Response('Database error', { status: 500 });
        }
    }

    // Personal history access
    if (userUuid && userUuid === userIdent.uuid) {
        try {
            const res = await query(`
                SELECT id, bank_name, account_no, card_value, status, created_at 
                FROM redemptionrequests 
                WHERE user_uuid = @userUuid 
                ORDER BY created_at DESC
            `, { userUuid });
            return Response.json(res.recordset || []);
        } catch (err) {
            return new Response('Database error', { status: 500 });
        }
    }

    return new Response('Forbidden', { status: 403 });
}

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) return new Response('Unauthorized', { status: 401 });

        // DB-First Identity Check
        const userRes = await query('SELECT uuid, username, "vipCoins" FROM "Users" WHERE uuid = @uuid', { uuid: session.uuid });
        const userIdent = userRes.recordset?.[0];
        if (!userIdent) return new Response('User Record Missing', { status: 404 });

        const body = await request.json();
        const { bankName, accountNo, accountHolder, amount } = body;

        if (!bankName || !accountNo || !accountHolder || !amount) {
            return new Response('Thiếu thông tin yêu cầu chuyển khoản', { status: 400 });
        }

        const val = parseInt(amount);
        const cost = val * 1000;

        if (userIdent.vipCoins < cost) {
            return new Response('Số dư VipCoins không đủ để rút tiền.', { status: 400 });
        }

        const userName = userIdent.username || 'Khách ẩn danh';
        const traceId = `BANK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        try {
            const { withTransaction } = await import('@/lib/db');
            
            await withTransaction(async (client) => {
                const updateRes = await client.query(
                    'UPDATE "Users" SET "vipCoins" = "vipCoins" - $1 WHERE uuid = $2 AND "vipCoins" >= $1',
                    [cost, session.uuid]
                );

                if (updateRes.rowCount === 0) {
                    throw new Error('Số dư VipCoins không đủ.');
                }

                await client.query(
                    `INSERT INTO redemptionrequests 
                    (user_uuid, user_name, bank_name, account_no, account_holder, card_value, status) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [session.uuid, userName, bankName, accountNo, accountHolder, val, 'Pending']
                );
            });

            return new Response('Yêu cầu rút tiền đã được gửi thành công!', { 
                status: 201,
                headers: { 'X-Trace-Id': traceId }
            });
        } catch (dbErr) {
            return new Response(dbErr.message, { status: 400 });
        }
    } catch (err) {
        return new Response('Lỗi hệ thống: ' + err.message, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return new Response('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { id, status } = body;

        if (!['Pending', 'Done', 'Rejected'].includes(status)) {
            return new Response('Trạng thái không hợp lệ', { status: 400 });
        }

        const res = await query(`UPDATE redemptionrequests SET status = @status WHERE id = @id`, { id: parseInt(id), status });
        
        if (res.rowCount === 0) {
            return new Response('Không tìm thấy bản ghi', { status: 404 });
        }

        return new Response('Updated', { status: 200 });
    } catch (err) {
        return new Response('Error updating', { status: 500 });
    }
}
