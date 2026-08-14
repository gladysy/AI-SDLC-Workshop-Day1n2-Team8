// Generate registration challenge for WebAuthn (PRP 11)
import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { userDB, authenticatorDB } from '@/lib/db';
import { saveChallenge } from '@/lib/challenges';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string' || username.length === 0) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    // Check if username is already taken by an account that already has passkeys.
    // If a user exists but has no authenticators, allow retry registration.
    const existing = userDB.findByUsername(username);
    const existingAuthenticators = existing
      ? authenticatorDB.findByUserId(existing.id)
      : [];
    if (existing && existingAuthenticators.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    const rpName = process.env.RP_NAME || 'Todo App';
    const rpID = process.env.RP_ID || 'localhost';
    // simplewebauthn v11+ requires userID as bytes, not string.
    const userID = new TextEncoder().encode(username);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID,
      userName: username,
      userDisplayName: username,
      attestationType: 'none',
      excludeCredentials: existingAuthenticators.map((auth) => ({
        id: auth.credential_id,
        transports: ['internal', 'usb', 'ble', 'nfc', 'hybrid'],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Store the challenge for later verification
    saveChallenge(username, options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error in register-options:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}
