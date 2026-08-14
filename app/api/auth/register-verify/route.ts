// Verify registration attestation and create user + session (PRP 11)
import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { userDB, authenticatorDB } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { getChallenge } from '@/lib/challenges';

export async function POST(request: NextRequest) {
  try {
    const { username, response } = await request.json();

    if (!username || !response) {
      return NextResponse.json(
        { error: 'Missing username or response' },
        { status: 400 }
      );
    }

    const expectedChallenge = getChallenge(username);
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found or expired' },
        { status: 400 }
      );
    }

    const rpID = process.env.RP_ID || 'localhost';
    const origin = process.env.RP_ORIGIN || 'http://localhost:3000';

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (error) {
      console.error('Registration verification failed:', error);
      return NextResponse.json(
        { error: 'Registration verification failed' },
        { status: 401 }
      );
    }

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'Registration failed verification' },
        { status: 401 }
      );
    }

    // simplewebauthn v11 stores credential data under registrationInfo.credential.
    // Keep fallback for older shapes to remain compatible.
    const registrationInfo = verification.registrationInfo as {
      counter?: number;
      credential?: { id?: string; publicKey?: Uint8Array };
      credentialID?: Uint8Array;
      credentialPublicKey?: Uint8Array;
    };

    const credentialId =
      registrationInfo.credential?.id ??
      (registrationInfo.credentialID
        ? Buffer.from(registrationInfo.credentialID).toString('base64url')
        : undefined);
    const credentialPublicKey =
      registrationInfo.credential?.publicKey ?? registrationInfo.credentialPublicKey;
    const counter = registrationInfo.counter ?? 0;

    if (!credentialId || !credentialPublicKey) {
      return NextResponse.json(
        { error: 'Missing credential data' },
        { status: 400 }
      );
    }

    // Reuse existing user when previous partial registration created one without passkeys.
    const existingUser = userDB.findByUsername(username);
    const userAuthenticators = existingUser
      ? authenticatorDB.findByUserId(existingUser.id)
      : [];
    if (existingUser && userAuthenticators.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    const user = existingUser ?? userDB.create(username);

    const duplicateAuthenticator = authenticatorDB.findByCredentialId(credentialId);
    if (duplicateAuthenticator) {
      if (duplicateAuthenticator.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Authenticator already registered to another user' },
          { status: 409 }
        );
      }

      // Idempotent retry for same user/passkey.
      await createSession(user);
      return NextResponse.json({ success: true });
    }

    authenticatorDB.create({
      user_id: user.id,
      credential_id: credentialId,
      credential_public_key: Buffer.from(credentialPublicKey),
      counter,
    });

    // Create session
    await createSession(user);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in register-verify:', error);
    return NextResponse.json(
      { error: 'Failed to verify registration' },
      { status: 500 }
    );
  }
}
