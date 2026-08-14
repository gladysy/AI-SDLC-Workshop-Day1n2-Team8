// Generate login challenge for WebAuthn (PRP 11)
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { userDB, authenticatorDB } from '@/lib/db';
import { saveChallenge } from '@/lib/challenges';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    const user = userDB.findByUsername(username);
    if (!user) {
      // Don't leak whether username exists
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const authenticators = authenticatorDB.findByUserId(user.id);
    if (authenticators.length === 0) {
      return NextResponse.json({ error: 'No authenticators found' }, { status: 404 });
    }

    const rpID = process.env.RP_ID || 'localhost';
    const transports: Array<'ble' | 'hybrid' | 'internal' | 'nfc' | 'usb'> = [
      'internal',
      'usb',
      'ble',
      'nfc',
      'hybrid',
    ];
    // Include all user's registered authenticators as allowed credentials
    const allowCredentials = authenticators.map((auth) => ({
      id: auth.credential_id,
      transports,
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Store the challenge for later verification
    saveChallenge(username, options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error in login-options:', error);
    return NextResponse.json(
      { error: 'Failed to generate login options' },
      { status: 500 }
    );
  }
}
