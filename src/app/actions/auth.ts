'use server';

import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const APP_PASSWORD = process.env.APP_PASSWORD;
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-change-me');

export async function login(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;

  if (password !== APP_PASSWORD) {
    return { error: 'Invalid password', success: false };
  }

  // Create JWT
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days instead of 24h
    .sign(JWT_SECRET);

  // Set Cookie
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Changed from 'strict' for better Capacitor compatibility
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return { success: true, error: null };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/login');
}
