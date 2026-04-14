import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request) {
    const session = await getSession();
    
    if (!session || session.role !== 'admin') {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const res = await query('SELECT * FROM "CrawlLogs" ORDER BY created_at DESC LIMIT 50');
        return Response.json(res.recordset || []);
    } catch (err) {
        return new Response('Database error', { status: 500 });
    }
}
