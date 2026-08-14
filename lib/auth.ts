// Session helper with WebAuthn/Passkey support and JWT cookies (PRP 11).
// SERVER-ONLY: handles session creation/verification using HTTP-only cookies.

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export interface Session {
  userId: number;
  username: string;
}

// Get the JWT secret from environment, or use a dev default
const SECRET_KEY = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : new TextEncoder().encode('dev-secret-key-do-not-use-in-production');

// Session expires after 7 days
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

/**
 * Create a new JWT session and set it as an HTTP-only cookie.
 * Called after successful registration or login.
 */
export async function createSession(user: { id: number; username: string }): Promise<void> {
  const token = await new SignJWT({
    userId: user.id,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });
}

/**
 * Read and verify the session from the HTTP-only cookie.
 * Returns the decoded session or null if absent/invalid/expired.
 * Called first in every protected API route.
 * Safe to call from Edge Runtime - doesn't load native modules.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return null;
    }

    const verified = await jwtVerify(token, SECRET_KEY);
    const payload = verified.payload as { userId?: number; username?: string } | null;

    if (!payload || typeof payload.userId !== 'number' || typeof payload.username !== 'string') {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
    };
  } catch (err) {
    // JWT verification failed, token expired, or any other error
    return null;
  }
}

/**
 * Delete the session cookie (logout).
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Ensure a default local user exists for development.
 * Used by the development flow until users authenticate via WebAuthn.
 * Note: lazy-loads db to avoid loading native modules at Edge Runtime.
 */
export function ensureDefaultUser(): { id: number; username: string } {
  // Lazy import to avoid loading better-sqlite3 at module scope
  const { userDB } = require('./db');
  return userDB.ensureDefault();
}
