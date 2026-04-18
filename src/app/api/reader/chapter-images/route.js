import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';
import { generateProxySignature } from '@/core/security/crypto';

export const GET = withTitan({
    handler: async (req) => {
        try {
            const { searchParams } = new URL(req.url);
            const id = searchParams.get('id');
            if (!id) {
                throw { status: 400, message: 'Missing id' };
            }

            const result = await query('SELECT image_url FROM chapterimages WHERE chapter_id = @id ORDER BY "order" ASC', { id });
            const images = (result.recordset || []).map(img => {
                const url = img.image_url;
                const w = 1200;
                const q = 80;
                const sig = generateProxySignature(url, w, q);
                return `/api/proxy?url=${encodeURIComponent(url)}&w=${w}&q=${q}&sig=${sig}`;
            });

            return { 
                success: true, 
                images
            };
        } catch (e) {
            console.error('ChapterImages error:', e);
            throw e;
        }
    }
});


