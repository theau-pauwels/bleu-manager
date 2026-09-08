import type { APIRoute } from 'astro';
import { z } from 'zod';
import { mutateDatabase } from '@lib/blob-db';

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
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Payload invalide' }), { status: 400, headers: { 'content-type': 'application/json' } });
  const p = parsed.data;
  const now = new Date().toISOString();

  const id = await mutateDatabase((database) => {
    const bleuId = database.nextBleuId++;
    database.bleus.push({
      id: bleuId,
      Nom: p.nom,
      Prenom: p.prenom,
      Sexe: p.sexe,
      DateN: p.daten,
      Adresse: p.adresse,
      Med: '',
      Com: '',
      Tel: p.tel,
      Regio: p.regio,
      Supp: false,
      RespLegal: p.resplegal,
      NumRespLegal: p.numresplegal,
      Ramassage1: '',
      Ramassage2: '',
      Ramassage3: '',
      Ramassage4: '',
      source: 'GOOGLE_FORM',
      createdAt: now,
      updatedAt: now
    });
    return bleuId;
  });

  return new Response(JSON.stringify({ ok: true, id }), { status: 201, headers: { 'content-type': 'application/json' } });
};
