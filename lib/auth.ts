// Session helper. SERVER-ONLY.
//
// TODO(PRP-11): Replace this development stub with real WebAuthn/passkey auth and
// JWT cookie sessions. Authentication is a separate PRP and out of scope for the
// Todo CRUD (PRP 01) and Priority (PRP 02) features. Until it is implemented, all
// todos are scoped to a single default local user so the app is fully usable.

import { userDB } from './db';

export interface Session {
  userId: number;
  username: string;
}

export async function getSession(): Promise<Session | null> {
  const user = userDB.ensureDefault();
  return { userId: user.id, username: user.username };
}
