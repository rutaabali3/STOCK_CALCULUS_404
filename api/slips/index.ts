import type { VercelRequest, VercelResponse, CalcInput } from '../_lib/types.js';
import { verifyToken } from '../_lib/auth.js';
import { getDb, ensureSchema } from '../_lib/db.js';
import { batchSlipsPayloadSchema } from '../_lib/schema.js';
import { computeSlip } from '../_lib/calc.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Authentication check
  const isAuthenticated = await verifyToken(req.headers.authorization);
  if (!isAuthenticated) {
    return res.status(401).json({
      error: { code: 'unauthorized', message: 'Valid authorization bearer token required' },
    });
  }

  const sql = getDb();
  await ensureSchema();

  /* -------------------------------------------------------------
   * POST: Batch Upsert Slips
   * ------------------------------------------------------------- */
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const parseResult = batchSlipsPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: { code: 'validation_error', message: parseResult.error.message },
      });
    }

    const { slips } = parseResult.data;
    const results: Array<{ id: string; status: 'created' | 'exists' | 'rejected'; error?: string }> = [];

    for (const slip of slips) {
      try {
        // 1. Recompute everything server-side using shared/calc.ts
        const calcInput: CalcInput = {
          weightsG: slip.weightsG,
          ratePaisa: slip.ratePaisa,
          tarePerBagG: slip.tarePerBagG,
          commission: slip.commission,
          labour: slip.labour,
          chargeMode: slip.chargeMode,
          roundToRupee: slip.roundToRupee,
        };

        const calc = computeSlip(calcInput);

        // Derive slip code
        const dateObj = new Date(slip.createdAt);
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const suffix = slip.id.slice(-4).toUpperCase();
        const slipCode = `${mm}${dd}-${suffix}`;

        // 2. Insert with ON CONFLICT DO NOTHING
        const commissionType = slip.commission?.type ?? null;
        const commissionValue =
          slip.commission?.type === 'percent'
            ? slip.commission.hundredthsPct
            : slip.commission?.type === 'fixed'
            ? slip.commission.paisa
            : null;

        const labourType = slip.labour?.type ?? null;
        const labourValue = slip.labour?.paisa ?? null;

        const inserted = await sql`
          INSERT INTO slips (
            id, slip_code, created_at, device_id, seller, buyer, receipt_name, note,
            bag_count, gross_g, tare_per_bag_g, net_g, rate_paisa, amount_paisa,
            commission_type, commission_value, commission_paisa,
            labour_type, labour_value, labour_paisa,
            charge_mode, round_to_rupee, total_paisa, total_rupees
          ) VALUES (
            ${slip.id}, ${slipCode}, ${slip.createdAt}::timestamptz, ${slip.deviceId ?? null},
            ${slip.seller ?? null}, ${slip.buyer ?? null}, ${slip.receiptName ?? null}, ${slip.note ?? null},
            ${calc.bagCount}, ${calc.grossG}, ${slip.tarePerBagG}, ${calc.netG}, ${slip.ratePaisa}, ${calc.amountPaisa},
            ${commissionType}, ${commissionValue}, ${calc.commissionPaisa},
            ${labourType}, ${labourValue}, ${calc.labourPaisa},
            ${slip.chargeMode}, ${slip.roundToRupee}, ${calc.totalPaisa}, ${calc.totalRupees}
          )
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;

        if (inserted.length > 0) {
          // Write bag weights
          for (let i = 0; i < slip.weightsG.length; i++) {
            await sql`
              INSERT INTO bag_weights (slip_id, seq, grams)
              VALUES (${slip.id}, ${i + 1}, ${slip.weightsG[i]})
              ON CONFLICT (slip_id, seq) DO NOTHING
            `;
          }
          results.push({ id: slip.id, status: 'created' });
        } else {
          results.push({ id: slip.id, status: 'exists' });
        }
      } catch (err: unknown) {
        console.error(`Error inserting slip ${slip.id}:`, err);
        const errorMsg = err instanceof Error ? err.message : 'Calculation/database error';
        results.push({ id: slip.id, status: 'rejected', error: errorMsg });
      }
    }

    return res.status(200).json({ results });
  }

  /* -------------------------------------------------------------
   * GET: Query Slips
   * ------------------------------------------------------------- */
  if (req.method === 'GET') {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 200, 1), 500);

    let rows;
    if (q) {
      rows = await sql`
        SELECT s.*, 
          COALESCE(
            (SELECT json_agg(bw.grams ORDER BY bw.seq)
             FROM bag_weights bw WHERE bw.slip_id = s.id),
            '[]'::json
          ) as "weightsG"
        FROM slips s
        WHERE lower(s.slip_code) LIKE ${`%${q}%`}
           OR lower(coalesce(s.seller, '')) LIKE ${`%${q}%`}
           OR lower(coalesce(s.buyer, '')) LIKE ${`%${q}%`}
        ORDER BY s.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        SELECT s.*,
          COALESCE(
            (SELECT json_agg(bw.grams ORDER BY bw.seq)
             FROM bag_weights bw WHERE bw.slip_id = s.id),
            '[]'::json
          ) as "weightsG"
        FROM slips s
        ORDER BY s.created_at DESC
        LIMIT ${limit}
      `;
    }

    return res.status(200).json({ slips: rows });
  }

  return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Method Not Allowed' } });
}
