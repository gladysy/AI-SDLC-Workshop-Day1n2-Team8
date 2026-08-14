// Edge Runtime compatible session verification for middleware (PRP 11).
// Does NOT import db.ts - only uses jose for JWT verification.
// Safe to import at Edge Runtime where native modules cannot load.

import { jwtVerify } from 'jose';
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';

export interface Session {
  userId: number;
  username: string;
}

// Get the JWT secret from environment, or use a dev default
const SECRET_KEY = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : new TextEncoder().encode('dev-secret-key-do-not-use-in-production');

/**
 * Verify session token from cookie (Edge Runtime safe).
 * Does not load db.ts or any native modules.
 * Used exclusively by middleware for route protection.
 */
export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  try {
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
