import { get, put } from '@vercel/blob';

export type Role = 'ADMIN' | 'CHEF_FLICS';

export interface UserRecord {
  id: number;
  username: string;
  displayName: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface SessionRecord {
  tokenHash: string;
  userId: number;
  expiresAt: string;
}

export interface BleuRecord {
  id: number;
  Nom: string;
  Prenom: string;
  Sexe: string;
  DateN: string;
  Adresse: string;
  Med: string;
  Com: string;
  Tel: string;
  Regio: string;
  Supp: boolean;
  RespLegal: string;
  NumRespLegal: string;
  Ramassage1: string;
  Ramassage2: string;
  Ramassage3: string;
  Ramassage4: string;
  source: 'MANUAL' | 'GOOGLE_FORM' | 'LEGACY_IMPORT';
  createdAt: string;
  updatedAt: string;
}

export interface BlobDatabase {
  version: 1;
  nextUserId: number;
  nextBleuId: number;
  users: UserRecord[];
  sessions: SessionRecord[];
  bleus: BleuRecord[];
}

const pathname = process.env.BLOB_DB_PATH?.trim() || 'bleu-manager/test-db.json';

function emptyDatabase(): BlobDatabase {
  return {
    version: 1,
    nextUserId: 1,
    nextBleuId: 1,
    users: [],
    sessions: [],
    bleus: []
  };
}

function normalizeDatabase(value: Partial<BlobDatabase>): BlobDatabase {
  const empty = emptyDatabase();
  return {
    ...empty,
    ...value,
    version: 1,
    users: Array.isArray(value.users) ? value.users : [],
    sessions: Array.isArray(value.sessions) ? value.sessions : [],
    bleus: Array.isArray(value.bleus) ? value.bleus : []
  };
}

export async function readDatabase(): Promise<BlobDatabase> {
  try {
    const result = await get(pathname, { access: 'private', useCache: false });
    const data = await new Response(result.stream).json() as Partial<BlobDatabase>;
    return normalizeDatabase(data);
  } catch (error: unknown) {
    const name = error instanceof Error ? error.name : '';
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: unknown }).status)
      : undefined;

    if (name === 'BlobNotFoundError' || status === 404) return emptyDatabase();
    throw error;
  }
}

export async function writeDatabase(database: BlobDatabase): Promise<void> {
  await put(pathname, JSON.stringify(database), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json'
  });
}

export async function mutateDatabase<T>(
  mutation: (database: BlobDatabase) => T | Promise<T>
): Promise<T> {
  const database = await readDatabase();
  const result = await mutation(database);
  await writeDatabase(database);
  return result;
}
