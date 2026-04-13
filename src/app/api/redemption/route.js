import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'truyenvip-admin-123';

export async function GET(request) {
    const session = await getSession();
    if (!session) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(request.url);
    const userUuid = searchParams.get('userUuid') || session.uuid;

    // DB-First Identity Check
    const userRes = await query('SELECT role, uuid FROM Users WHERE uuid = @uuid', { uuid: session.uuid });
    const userIdent = userRes.recordset[0];
    if (!userIdent) return new Response('User not found', { status: 404 });

    // Admin access
    if (userIdent.role === 'admin') {
        try {
            const res = await query(`
                SELECT id, user_uuid as user_uuid, user_name, card_type, card_value, phone_number, status, created_at 
                FROM RedemptionRequests 
                ORDER BY created_at DESC
            `);
            return Response.json(res.recordset);
        } catch (err) {
            return new Response('Database error', { status: 500 });
        }
    }

    // Personal history access (Ensuring uuid matches session)
    if (userUuid && userUuid === userIdent.uuid) {
        try {
            const res = await query("SELECT * FROM RedemptionRequests WHERE user_uuid = @userUuid ORDER BY created_at DESC", { userUuid });
            return Response.json(res.recordset);
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

        // DB-First Identity Check and Balance verification prep
        const userRes = await query('SELECT uuid, username, vipCoins FROM Users WHERE uuid = @uuid', { uuid: session.uuid });
        const userIdent = userRes.recordset[0];
        if (!userIdent) return new Response('User Record Missing', { status: 404 });

        const body = await request.json();
        const { cardType, cardValue, phoneNumber } = body;

        if (!cardType || !cardValue || !phoneNumber) {
            return new Response('Thiếu thông tin yêu cầu', { status: 400 });
        }

        const val = parseInt(cardValue);
        const cost = val * 1000;

        const userName = userIdent.username || 'Đạo hữu ẩn danh';

        // ATOMIC TRANSACTION WITH TRACEABILITY
        const traceId = `RED-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        console.log(`[Redeem][${traceId}] Attempt started for ${userIdent.uuid} (${userName})`);

        try {
            const { withTransaction } = await import('@/lib/db');
            
            await withTransaction(async (client) => {
                // In Postgres, we use standard SQL and check rowCount on the client
                const updateRes = await client.query(
                    'UPDATE Users SET "vipCoins" = "vipCoins" - $1 WHERE uuid = $2 AND "vipCoins" >= $1',
                    [cost, session.uuid]
                );

                if (updateRes.rowCount === 0) {
                    throw new Error('Số dư VipCoins không đủ để thực hiện giao dịch này.');
                }

                await client.query(
                    'INSERT INTO "RedemptionRequests" (user_uuid, user_name, card_type, card_value, phone_number, status) VALUES ($1, $2, $3, $4, $5, $6)',
                    [session.uuid, userName, cardType, val, phoneNumber, 'pending']
                );
            });

            console.log(`[Redeem][${traceId}] Success. Cost: ${cost} coins.`);
            return new Response('Yêu cầu đổi quà đã được ghi nhận!', { 
                status: 201,
                headers: { 'X-Trace-Id': traceId }
            });
        } catch (dbErr) {
            if (dbErr.message.includes('Số dư')) {
                return new Response(dbErr.message, { status: 400 });
            }
            throw dbErr;
        }
    } catch (err) {
        const errorTraceId = `ERR-${Date.now()}`;
        console.error(`[Redeem][${errorTraceId}] FATAL:`, err.message);
        return new Response(`Lỗi hệ thống (${errorTraceId}): ` + err.message, { status: 500 });
    }
}

// PATCH to update status (Admin)
export async function PATCH(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return new Response('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { id, status } = body;

        const res = await query("UPDATE RedemptionRequests SET status = @status WHERE id = @id", { id, status });
        
        if (res.rowCount === 0) {
            return new Response('Không tìm thấy yêu cầu đổi quà', { status: 404 });
        }

        return new Response('Updated', { status: 200 });
    } catch (err) {
        return new Response('Error updating', { status: 500 });
    }
}
