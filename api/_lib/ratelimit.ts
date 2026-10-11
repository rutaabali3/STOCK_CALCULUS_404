import { getDb } from './db.js';

/**
 * Throttle login attempts:
 * If >= 5 failed attempts from the same IP in the last 15 minutes -> return false (rate limited).
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  try {
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
  } catch (err: unknown) {
    // If table doesn't exist or DB is initializing, fail-open so user is not blocked
    console.error('Rate limit check warning:', err);
    return true;
  }
}

export async function recordLoginAttempt(ip: string, ok: boolean): Promise<void> {
  try {
    const sql = getDb();
    await sql`
      INSERT INTO login_attempts (ip, ok)
      VALUES (${ip}, ${ok})
    `;
  } catch (err: unknown) {
    console.error('Record login attempt warning:', err);
  }
}
