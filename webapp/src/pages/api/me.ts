import type { APIRoute } from 'astro';
import { currentUser } from '@lib/auth';
export const GET: APIRoute = async ({ cookies }) => {
  const user = await currentUser(cookies);
  return user
    ? new Response(JSON.stringify(user), { headers: { 'content-type': 'application/json' } })
    : new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
};
