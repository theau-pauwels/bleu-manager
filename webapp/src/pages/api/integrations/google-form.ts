import type { APIRoute } from 'astro';
import { z } from 'zod';
import { query } from '@lib/db';

const payloadSchema = z.object({
  nom: z.string().trim().min(1).max(255),
  prenom: z.string().trim().min(1).max(255),
  sexe: z.string().trim().max(255).default(''),
  adresse: z.string().trim().max(2000).default(''),
  daten: z.string().trim().max(255).default(''),
  regio: z.string().trim().max(255).default(''),
  resplegal: z.string().trim().max(1000).default(''),
  numresplegal: z.string().trim().max(255).default(''),
  tel: z.string().trim().max(255).default('')
});

export const POST: APIRoute = async ({ request }) => {
  const expected = process.env.GOOGLE_FORMS_WEBHOOK_SECRET;
  const contentType = request.headers.get('content-type') || '';
  let raw: Record<string, unknown> = {};
  if (contentType.includes('application/json')) raw = await request.json().catch(() => ({}));
  else raw = Object.fromEntries((await request.formData()).entries());

  const supplied = request.headers.get('x-google-forms-secret') || String(raw.secret || '');
  if (!expected || supplied !== expected) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Payload invalide', details: parsed.error.flatten() }), { status: 400, headers: { 'content-type': 'application/json' } });
  const p = parsed.data;
  await query(
    `INSERT INTO bleus (Nom, Prenom, Sexe, DateN, Adresse, Tel, Regio, RespLegal, NumRespLegal, source)
     VALUES (:nom, :prenom, :sexe, :daten, :adresse, :tel, :regio, :resplegal, :numresplegal, 'GOOGLE_FORM')`,
    p
  );
  return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { 'content-type': 'application/json' } });
};
