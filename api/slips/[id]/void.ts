import type { VercelRequest, VercelResponse } from '../../_lib/types.js';
import { verifyToken } from '../../_lib/auth.js';
import { getDb } from '../../_lib/db.js';
import { voidSlipSchema } from '../../_lib/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Method Not Allowed' } });
  }

  const isAuthenticated = await verifyToken(req.headers.authorization);
  if (!isAuthenticated) {
    return res.status(401).json({
      error: { code: 'unauthorized', message: 'Valid authorization bearer token required' },
    });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: { code: 'bad_request', message: 'Slip id is required' } });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const parseResult = voidSlipSchema.safeParse(body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { code: 'validation_error', message: parseResult.error.message } });
  }

  const { reason } = parseResult.data;
  const sql = getDb();

  // Idempotent void: update if not already voided
  await sql`
    UPDATE slips
    SET voided_at = COALESCE(voided_at, now()),
        void_reason = COALESCE(void_reason, ${reason})
    WHERE id = ${id}
  `;

  return res.status(200).json({ ok: true });
}
