import { getDb } from './db';

/**
 * Throttle login attempts:
 * If >= 5 failed attempts from the same IP in the last 15 minutes -> return false (rate limited).
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const sql = getDb();
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const rows = await sql`
    SELECT COUNT(*)::int as failures
    FROM login_attempts
    WHERE ip = ${ip}
      AND ok = false
      AND at >= ${fifteenMinutesAgo}::timestamptz
  `;

  const failures = (rows[0]?.failures as number) ?? 0;
  return failures < 5;
}

export async function recordLoginAttempt(ip: string, ok: boolean): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO login_attempts (ip, ok)
    VALUES (${ip}, ${ok})
  `;
}
