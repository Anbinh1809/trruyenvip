import { query } from '@/lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { message, stack, digest, url } = body;

        // Log to AuditLogs for now, but in a real titan-grade system, this would go to Sentry or a dedicated table
        await query(`
            INSERT INTO AuditLogs (user_id, action, details) 
            VALUES (0, 'CLIENT_CRASH', @details)
        `, { 
            details: JSON.stringify({ 
                msg: message?.substring(0, 500), 
                stack: stack?.substring(0, 1000), 
                digest, 
                url,
                ua: req.headers.get('user-agent'),
                ts: new Date().toISOString()
            }) 
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        return new Response('Error saving crash report', { status: 500 });
    }
}
