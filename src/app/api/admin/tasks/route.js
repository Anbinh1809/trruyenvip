import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return new Response('Unauthorized', { status: 401 });
        }

        const taskCounts = await query(`
            SELECT 
                status, 
                COUNT(*) as count
            FROM CrawlerTasks
            GROUP BY status
        `);

        // Get recent failures for diagnostics
        const recentFailures = await query(`
            SELECT id, type, last_error, attempts, updated_at
            FROM CrawlerTasks
            WHERE status = 'failed'
            ORDER BY updated_at DESC
            LIMIT 10
        `);

        // ERROR HEATmap: Group errors by signature
        const errorHeatmap = await query(`
            SELECT 
                LEFT(last_error, 50) as signature,
                COUNT(*) as count
            FROM CrawlerTasks
            WHERE status = 'failed'
            GROUP BY LEFT(last_error, 50)
            ORDER BY count DESC
            LIMIT 5
        `);

        return NextResponse.json({
            counts: taskCounts.recordset,
            failures: recentFailures.recordset,
            heatmap: errorHeatmap.recordset
        });
    } catch (err) {
        console.error('Admin Tasks Error:', err);
        return new Response('Error fetching tasks', { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return new Response('Unauthorized', { status: 401 });
        }

        const { action } = await request.json();

        if (action === 'retry_failed') {
            await query("UPDATE CrawlerTasks SET status = 'pending', attempts = 0 WHERE status = 'failed'");
            await query("INSERT INTO AuditLogs (admin_uuid, action, details) VALUES (@uuid, 'RETRY_FAILED_TASKS', 'Admin triggered bulk retry for all failed tasks')", { uuid: session.uuid });
            return NextResponse.json({ message: 'Retrying failed tasks' });
        }

        if (action === 'purge_completed') {
            await query("DELETE FROM CrawlerTasks WHERE status = 'completed'");
            await query("INSERT INTO AuditLogs (admin_uuid, action, details) VALUES (@uuid, 'PURGE_COMPLETED_TASKS', 'Admin purged all completed crawler task records')", { uuid: session.uuid });
            return NextResponse.json({ message: 'Purged completed tasks' });
        }

        return new Response('Invalid action', { status: 400 });
    } catch (err) {
        return new Response('Error', { status: 500 });
    }
}
