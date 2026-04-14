import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request) {
    try {
        const session = await getSession();
        if (!session) return new Response('Unauthorized', { status: 401 });

        const body = await request.json();
        const { avatar } = body;

        // Validation: Simple URL check or length limit
        if (avatar && avatar.length > 500) {
            return new Response('URL too long', { status: 400 });
        }

        await query('UPDATE users SET avatar = @avatar WHERE uuid = @uuid', { 
            avatar: avatar || null, 
            uuid: session.uuid 
        });

        return new Response('Profile updated', { status: 200 });
    } catch (err) {
        console.error('Profile Update Error:', err);
        return new Response('Error updating profile', { status: 500 });
    }
}
