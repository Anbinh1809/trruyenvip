import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-123456');

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // FETCH FULL RECORD TO BE ABSOLUTELY SURE
    const res = await query('SELECT uuid, username, email, role, avatar, xp, vipcoins, mission_data FROM users WHERE uuid = @uuid', { uuid: payload.uuid });
    const user = res.recordset?.[0];

    if (!user) {
        return NextResponse.json({ authenticated: false, error: 'User not found' }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        uuid: user.uuid,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        xp: user.xp,
        vipCoins: user.vipCoins,
        missionData: user.mission_data
      }
    }, { status: 200 });
  } catch (err) {
    console.error('Identity Verification Failed:', err.message);
    return NextResponse.json({ authenticated: false, error: 'Invalid Session' }, { status: 200 });
  }
}

