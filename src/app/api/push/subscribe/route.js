import { query } from '@/core/database/connection';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const body = await req.json();
        const { mangaId, subscription } = body;

        if (!mangaId || !subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Missing mangaId or valid subscription' }, { status: 400 });
        }

        const { endpoint, keys } = subscription;
        const { p256dh, auth } = keys || {};

        if (!p256dh || !auth) {
            return NextResponse.json({ error: 'Invalid subscription keys' }, { status: 400 });
        }

        // Store the subscription using upsert (UNIQUE constraint on manga_id and endpoint)
        await query(`
            INSERT INTO pushsubscriptions (manga_id, endpoint, p256dh, auth)
            VALUES (@mangaId, @endpoint, @p256dh, @auth)
            ON CONFLICT (manga_id, endpoint) DO UPDATE 
            SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
        `, { mangaId, endpoint, p256dh, auth });

        return NextResponse.json({ success: true, message: 'Subscribed successfully' });

    } catch (err) {
        console.error('[Push Subscription API] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

