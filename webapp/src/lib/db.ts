import mysql from 'mysql2/promise';

let pool: mysql.Pool | undefined;

export function db() {
  if (!pool) {
    const uri = process.env.DATABASE_URL;
    if (!uri) throw new Error('DATABASE_URL is missing');
    pool = mysql.createPool({
      uri,
      connectionLimit: 10,
      waitForConnections: true,
      namedPlaceholders: true,
      charset: 'utf8mb4'
    });
  }
  return pool;
}

export async function query<T = any[]>(sql: string, params: Record<string, unknown> = {}) {
  const [rows] = await db().execute(sql, params);
  return rows as T;
}
