import type { APIRoute } from 'astro';
import { z } from 'zod';
import { currentUser, hashPassword } from '@lib/auth';
import { mutateDatabase, readDatabase } from '@lib/blob-db';

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
  const database = await readDatabase();
  const rows = [...database.users]
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'))
    .map(({ id, username, displayName, role, active, createdAt }) => ({ id, username, displayName, role, active, createdAt }));
  return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!(await admin(cookies))) return new Response(null, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Champs invalides.' }), { status: 400, headers: { 'content-type': 'application/json' } });
  const passwordHash = await hashPassword(parsed.data.password);

  const created = await mutateDatabase((database) => {
    if (database.users.some((user) => user.username.toLowerCase() === parsed.data.username.toLowerCase())) return false;
    database.users.push({
      id: database.nextUserId++,
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      passwordHash,
      role: 'CHEF_FLICS',
      active: true,
      createdAt: new Date().toISOString()
    });
    return true;
  });

  if (!created) return new Response(JSON.stringify({ error: 'Cet identifiant existe déjà.' }), { status: 409, headers: { 'content-type': 'application/json' } });
  return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { 'content-type': 'application/json' } });
};
