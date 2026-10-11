import type { VercelRequest, VercelResponse } from '../_lib/types.js';
import { verifyToken } from '../_lib/auth.js';
import { getDb } from '../_lib/db.js';
import { buildCsvRow } from '../_lib/csv.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'method_not_allowed', message: 'Method Not Allowed' } });
  }

  const isAuthenticated = await verifyToken(req.headers.authorization);
  if (!isAuthenticated) {
    return res.status(401).json({
      error: { code: 'unauthorized', message: 'Valid authorization bearer token required' },
    });
  }

  const sql = getDb();

  const rows = await sql`
    SELECT s.*,
      COALESCE(
        (SELECT string_agg(bw.grams::text, '; ' ORDER BY bw.seq)
         FROM bag_weights bw WHERE bw.slip_id = s.id),
        ''
      ) as bag_weights_str
    FROM slips s
    ORDER BY s.created_at DESC
  `;

  // Headers
  const headers = [
    'slip_code',
    'created_at',
    'seller',
    'buyer',
    'bag_count',
    'weights_g',
    'gross_kg',
    'tare_kg',
    'net_kg',
    'rate_per_mann',
    'amount',
    'commission',
    'labour',
    'charge_mode',
    'total',
    'voided',
    'void_reason',
    'note',
  ];

  const csvRows: string[] = [buildCsvRow(headers)];

  for (const r of rows) {
    const grossKg = (Number(r.gross_g) / 1000).toFixed(3);
    const tareKg = ((Number(r.tare_per_bag_g) * Number(r.bag_count)) / 1000).toFixed(3);
    const netKg = (Number(r.net_g) / 1000).toFixed(3);
    const rateRupees = (Number(r.rate_paisa) / 100).toFixed(2);
    const amountRupees = (Number(r.amount_paisa) / 100).toFixed(2);
    const commissionRupees = (Number(r.commission_paisa) / 100).toFixed(2);
    const labourRupees = (Number(r.labour_paisa) / 100).toFixed(2);
    const totalRupees = r.round_to_rupee ? String(r.total_rupees) : (Number(r.total_paisa) / 100).toFixed(2);

    csvRows.push(
      buildCsvRow([
        r.slip_code as string,
        r.created_at as string,
        (r.seller as string) || '',
        (r.buyer as string) || '',
        r.bag_count as number,
        r.bag_weights_str as string,
        grossKg,
        tareKg,
        netKg,
        rateRupees,
        amountRupees,
        commissionRupees,
        labourRupees,
        r.charge_mode as string,
        totalRupees,
        r.voided_at ? 'YES' : 'NO',
        (r.void_reason as string) || '',
        (r.note as string) || '',
      ])
    );
  }

  // UTF-8 BOM (\uFEFF) ensures Excel opens special characters and text without mojibake
  const csvContent = '\uFEFF' + csvRows.join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="mandi-slips-export.csv"');
  return res.status(200).send(csvContent);
}
