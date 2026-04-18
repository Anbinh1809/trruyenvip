import { getSession, setSessionCookie, signToken, verifyToken } from '@/core/security/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withTitan } from '@/core/api/handler';

export const POST = withTitan({
    allowOptional: true,
    handler: async (req, session) => {
        if (!session) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // TITAN HEARTBEAT: Optimized Sliding Window
        // Only refresh the token if it's older than 24 hours to reduce overhead
        const now = Math.floor(Date.now() / 1000);
        const tokenAge = now - (session.iat || 0);
        const ONE_DAY = 24 * 60 * 60;

        if (tokenAge > ONE_DAY) {
            console.log(`[TITAN INFO] Session sliding: Refreshing token for ${session.username} (Age: ${tokenAge}s)`);
            const freshToken = await signToken({ 
                uuid: session.uuid, 
                username: session.username, 
                role: session.role 
            });
            await setSessionCookie(freshToken);
        }

        // TITAN AUTOMATION: Trigger crawler pulse if needed (Throttled to 5 mins)
        // This ensures the crawler runs as soon as any user interacts with the web
        const { checkAndPulse } = await import('@/core/crawler/automation');
        checkAndPulse().catch(() => {});

        return NextResponse.json({ auth: true, user: session });
    }
});


