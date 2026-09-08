import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createSession, ensureBootstrapAdmin, verifyLogin } from '@lib/auth';

const schema = z.object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(300) });

export const POST: APIRoute = async ({ request, cookies }) => {
  await ensureBootstrapAdmin();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Requête invalide' }), { status: 400 });
  const user = await verifyLogin(parsed.data.username, parsed.data.password);
  if (!user) return new Response(JSON.stringify({ error: 'Identifiants invalides' }), { status: 401 });
  await createSession(cookies, user.id);
  return new Response(JSON.stringify({ ok: true, role: user.role }), { headers: { 'content-type': 'application/json' } });
};
