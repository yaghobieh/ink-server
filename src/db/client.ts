import { neon } from '@neondatabase/serverless';
import { CONFIG } from '../const/index.js';

let sqlClient: ReturnType<typeof neon> | null = null;

export const getSql = (): ReturnType<typeof neon> => {
  if (!CONFIG.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  if (!sqlClient) {
    sqlClient = neon(CONFIG.DATABASE_URL);
  }
  return sqlClient;
};

export const pingDatabase = async (): Promise<boolean> => {
  const sql = getSql();
  const rows = await sql`SELECT 1 AS ok`;
  return Array.isArray(rows) && rows.length > 0;
};
