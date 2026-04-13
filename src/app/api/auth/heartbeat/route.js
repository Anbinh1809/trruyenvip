import { getSession, setSessionCookie, signToken, verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // TITAN HEARTBEAT: Optimized Sliding Window
        // Only refresh the token if it's older than 24 hours to reduce overhead
        const now = Math.floor(Date.now() / 1000);
        const tokenAge = now - (session.iat || 0);
        const ONE_DAY = 24 * 60 * 60;

        if (tokenAge > ONE_DAY) {
            console.log(`[Auth] Session sliding: Refreshing token for ${session.username} (Age: ${tokenAge}s)`);
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
