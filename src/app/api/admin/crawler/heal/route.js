import { withTitan } from '@/core/api/handler';
import { healChapterGaps } from '@/core/crawler';

export const POST = withTitan({
    admin: true,
    handler: async () => {
        // Trigger healing in the background to avoid timeout
        healChapterGaps(20).catch(err => console.error('[Heal API] Async error:', err));

        return { 
            success: true, 
            message: 'Quy trình vá lỗi (Gap Healing) đã được kích hoạt thành công!'
        };
    }
});
