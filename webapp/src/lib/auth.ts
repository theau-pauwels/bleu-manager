import type { AstroCookies } from 'astro';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { mutateDatabase, readDatabase, type Role } from './blob-db';

export type { Role } from './blob-db';
export type SessionUser = { id: number; username: string; displayName: string; role: Role };

const COOKIE = 'bleu_session';

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function ensureBootstrapAdmin() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const displayName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'Administrateur';
  if (!username || !password) return;

  await mutateDatabase(async (database) => {
    if (database.users.some((user) => user.role === 'ADMIN')) return;

    database.users.push({
      id: database.nextUserId++,
      username,
      displayName,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMIN',
      active: true,
      createdAt: new Date().toISOString()
    });
  });
}

export async function verifyLogin(username: string, password: string): Promise<SessionUser | null> {
  const database = await readDatabase();
  const user = database.users.find((candidate) => candidate.username === username && candidate.active);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return { id: user.id, username: user.username, displayName: user.displayName, role: user.role };
}

export async function createSession(cookies: AstroCookies, userId: number) {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = sha256(token);
  const ttlDays = Number(process.env.SESSION_TTL_DAYS || 7);
  const expires = new Date(Date.now() + ttlDays * 86400000);

  await mutateDatabase((database) => {
    const now = Date.now();
    database.sessions = database.sessions.filter((session) => new Date(session.expiresAt).getTime() > now);
    database.sessions.push({ tokenHash, userId, expiresAt: expires.toISOString() });
  });

  cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    expires
  });
}

export async function currentUser(cookies: AstroCookies): Promise<SessionUser | null> {
  const token = cookies.get(COOKIE)?.value;
  if (!token) return null;

  const database = await readDatabase();
  const tokenHash = sha256(token);
  const session = database.sessions.find(
    (candidate) => candidate.tokenHash === tokenHash && new Date(candidate.expiresAt).getTime() > Date.now()
  );
  if (!session) return null;

  const user = database.users.find((candidate) => candidate.id === session.userId && candidate.active);
  return user ? { id: user.id, username: user.username, displayName: user.displayName, role: user.role } : null;
}

export async function destroySession(cookies: AstroCookies) {
  const token = cookies.get(COOKIE)?.value;
  if (token) {
    const tokenHash = sha256(token);
    await mutateDatabase((database) => {
      database.sessions = database.sessions.filter((session) => session.tokenHash !== tokenHash);
    });
  }
  cookies.delete(COOKIE, { path: '/' });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
