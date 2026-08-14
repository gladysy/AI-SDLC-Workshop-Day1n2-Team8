// Challenge store for WebAuthn registration and authentication flows.
// This is a simple in-memory store; for production, use a database with TTL.

const challenges: Map<string, { challenge: string; expiresAt: number }> = new Map();

const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Save a challenge keyed by username. Challenges expire after 5 minutes.
 */
export function saveChallenge(username: string, challenge: string): void {
  challenges.set(username, {
    challenge,
    expiresAt: Date.now() + CHALLENGE_EXPIRY_MS,
  });
}

/**
 * Get a challenge for a username, then delete it (single-use).
 * Returns null if not found or expired.
 */
export function getChallenge(username: string): string | null {
  const entry = challenges.get(username);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    challenges.delete(username);
    return null;
  }

  challenges.delete(username); // Single-use
  return entry.challenge;
}

/**
 * Clean up expired challenges (can be called periodically).
 */
export function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, entry] of challenges.entries()) {
    if (now > entry.expiresAt) {
      challenges.delete(key);
    }
  }
}
