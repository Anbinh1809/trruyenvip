import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

import { cache } from 'react';
 
const secretString = process.env.JWT_SECRET;
if (!secretString && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
}
 
const secret = new TextEncoder().encode(
  secretString || 'truyenvip_default_secret_key_change_me'
);
 
export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}
 
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}
 
export const getSession = cache(async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch (e) {
    // Return null if cookies() is inaccessible (e.g. during static generation)
    return null;
  }
});

export async function setSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
}
