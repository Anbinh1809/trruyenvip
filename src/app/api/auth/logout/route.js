import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/HeThong/BaoMat/XacThuc';

export async function POST() {
    await clearSessionCookie();
    return NextResponse.json({ message: 'Äà£ Ä‘Äƒng xuáº¥t' });
}

