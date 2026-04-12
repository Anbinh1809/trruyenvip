import { getSession, setSessionCookie, signToken, verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // TITAN HEARTBEAT: Refresh the token to extend the sliding window session
        // Only refresh if the token is valid
        const cookieStore = await cookies();
        const oldToken = cookieStore.get('token')?.value;
        
        if (oldToken) {
            const freshToken = await signToken({ 
                uuid: session.uuid, 
                username: session.username, 
                role: session.role 
            });
            await setSessionCookie(freshToken);
        }

        return NextResponse.json({ authenticated: true, user: session });
    } catch (e) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
