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

let schemaInitialized = false;

export async function ensureSchema(): Promise<void> {
  if (schemaInitialized) return;
  try {
    const sql = getDb();
    await sql`
      CREATE TABLE IF NOT EXISTS slips (
        id              text primary key,
        slip_code       text not null,
        created_at      timestamptz not null,
        received_at     timestamptz not null default now(),
        device_id       text,
        seller          text,
        buyer           text,
        receipt_name    text,
        note            text,
        bag_count       int not null,
        gross_g         bigint not null,
        tare_per_bag_g  int not null default 0,
        net_g           bigint not null,
        rate_paisa      bigint not null,
        amount_paisa    bigint not null,
        commission_type text,
        commission_value bigint,
        commission_paisa bigint not null default 0,
        labour_type     text,
        labour_value    bigint,
        labour_paisa    bigint not null default 0,
        charge_mode     text not null default 'add',
        round_to_rupee  boolean not null default true,
        total_paisa     bigint not null,
        total_rupees    numeric(18, 2) not null,
        voided_at       timestamptz,
        void_reason     text
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bag_weights (
        slip_id text not null references slips(id) on delete cascade,
        seq     int  not null,
        grams   int  not null,
        primary key (slip_id, seq)
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS slips_created_idx on slips (created_at desc);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS slips_seller_idx on slips (lower(seller));
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS slips_buyer_idx on slips (lower(buyer));
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id bigserial primary key,
        ip text not null,
        at timestamptz not null default now(),
        ok boolean not null
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS login_attempts_ip_at on login_attempts (ip, at desc);
    `;

    schemaInitialized = true;
  } catch (err: unknown) {
    console.error('Schema initialization error:', err);
  }
}
