// Verify login assertion and create session (PRP 11)
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
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

    const user = userDB.findByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const expectedChallenge = getChallenge(username);
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found or expired' },
        { status: 400 }
      );
    }

    // Look up authenticator by credential ID
    const credentialID = response.id;
    const authenticator = authenticatorDB.findByCredentialId(credentialID);
    if (!authenticator) {
      return NextResponse.json(
        { error: 'Authenticator not recognized' },
        { status: 401 }
      );
    }

    const rpID = process.env.RP_ID || 'localhost';
    const origin = process.env.RP_ORIGIN || 'http://localhost:3000';

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: authenticator.credential_id,
          publicKey: authenticator.credential_public_key,
          counter: authenticator.counter ?? 0, // Always coalesce counter
        },
      });
    } catch (error) {
      console.error('Authentication verification failed:', error);
      return NextResponse.json(
        { error: 'Authentication verification failed' },
        { status: 401 }
      );
    }

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Update counter (coalesce to 0 if undefined)
    const newCounter = verification.authenticationInfo?.newCounter ?? 0;
    authenticatorDB.updateCounter(authenticator.id, newCounter);

    // Create session
    await createSession(user);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in login-verify:', error);
    return NextResponse.json(
      { error: 'Failed to verify login' },
      { status: 500 }
    );
  }
}
