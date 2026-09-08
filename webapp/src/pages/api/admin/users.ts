import type { APIRoute } from 'astro';
import { z } from 'zod';
import { currentUser, hashPassword } from '@lib/auth';
import { query } from '@lib/db';

const createSchema = z.object({
  username: z.string().trim().min(3).max(100).regex(/^[a-zA-Z0-9._-]+$/),
  displayName: z.string().trim().min(2).max(120),
  password: z.string().min(10).max(300)
});

async function admin(cookies: Parameters<typeof currentUser>[0]) {
  const user = await currentUser(cookies);
  return user?.role === 'ADMIN' ? user : null;
}

export const GET: APIRoute = async ({ cookies }) => {
  if (!(await admin(cookies))) return new Response(null, { status: 403 });
  const rows = await query<any[]>('SELECT id, username, display_name AS displayName, role, active, created_at AS createdAt FROM users ORDER BY role, display_name');
  return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!(await admin(cookies))) return new Response(null, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Champs invalides.' }), { status: 400, headers: { 'content-type': 'application/json' } });
  const passwordHash = await hashPassword(parsed.data.password);
  try {
    await query(`INSERT INTO users (username, display_name, password_hash, role) VALUES (:username, :displayName, :passwordHash, 'CHEF_FLICS')`, { ...parsed.data, passwordHash });
  } catch (error: any) {
    if (error?.code === 'ER_DUP_ENTRY') return new Response(JSON.stringify({ error: 'Cet identifiant existe déjà.' }), { status: 409, headers: { 'content-type': 'application/json' } });
    throw error;
  }
  return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { 'content-type': 'application/json' } });
};
