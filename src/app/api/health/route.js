import { query } from '@/HeThong/Database/CoSoDuLieu';
import { withTitan } from '@/HeThong/API/XuLyAPI';

export const GET = withTitan({
    handler: async () => {
        // Test database connection with a simple query
        const result = await query('SELECT 1 as status');
        
        const mem = process.memoryUsage();
        if (result.recordset.length > 0) {
            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                database: 'connected',
                memory: {
                   rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
                   heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
                   heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`
                },
                uptime: `${Math.round(process.uptime())}s`
            };
        }
        throw new Error('Database connection failed');
    }
});

