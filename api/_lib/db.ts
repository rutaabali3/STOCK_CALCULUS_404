import { neon } from '@neondatabase/serverless';

export function getDb() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.STORAGE_URL;
  if (!url) {
    throw new Error('Database connection URL (DATABASE_URL / POSTGRES_URL / STORAGE_URL) is missing');
  }
  return neon(url);
}
