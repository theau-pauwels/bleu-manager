import type { AstroCookies } from 'astro';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { query } from './db';

export type Role = 'ADMIN' | 'CHEF_FLICS';
export type SessionUser = { id: number; username: string; displayName: string; role: Role };

const COOKIE = 'bleu_session';

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function ensureBootstrapAdmin() {
  const rows = await query<any[]>('SELECT COUNT(*) AS total FROM users WHERE role = \'ADMIN\'');
  if (Number(rows[0]?.total ?? 0) > 0) return;

  const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const displayName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'Administrateur';
  if (!username || !password) return;

  const hash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users (username, display_name, password_hash, role)
     VALUES (:username, :displayName, :hash, 'ADMIN')`,
    { username, displayName, hash }
  );
}

export async function verifyLogin(username: string, password: string): Promise<SessionUser | null> {
  const rows = await query<any[]>(
    `SELECT id, username, display_name, password_hash, role
     FROM users WHERE username = :username AND active = 1 LIMIT 1`,
    { username }
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
  return { id: user.id, username: user.username, displayName: user.display_name, role: user.role };
}

export async function createSession(cookies: AstroCookies, userId: number) {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = sha256(token);
  const ttlDays = Number(process.env.SESSION_TTL_DAYS || 7);
  const expires = new Date(Date.now() + ttlDays * 86400000);

  await query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (:tokenHash, :userId, :expires)',
    { tokenHash, userId, expires }
  );

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

  const rows = await query<any[]>(
    `SELECT u.id, u.username, u.display_name, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = :tokenHash AND s.expires_at > NOW() AND u.active = 1
      LIMIT 1`,
    { tokenHash: sha256(token) }
  );
  const user = rows[0];
  return user ? { id: user.id, username: user.username, displayName: user.display_name, role: user.role } : null;
}

export async function destroySession(cookies: AstroCookies) {
  const token = cookies.get(COOKIE)?.value;
  if (token) await query('DELETE FROM sessions WHERE token_hash = :tokenHash', { tokenHash: sha256(token) });
  cookies.delete(COOKIE, { path: '/' });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
