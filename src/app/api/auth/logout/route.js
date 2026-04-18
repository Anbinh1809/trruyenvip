import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/core/security/auth';

export async function POST() {
    await clearSessionCookie();
    return NextResponse.json({ message: 'Äà£ Ä‘Äƒng xuáº¥t' });
}


