# Mandi Weighment & Cost Calculator — Build Plan

Hand this file to the coding agent as the single source of truth. Work phase by phase (section 14). Do not skip the verification step at the end of each phase.

---

## 0. Rules for the agent

- Read this whole file before writing code. Produce an implementation plan and wait for approval before Phase 1.
- Language: TypeScript everywhere (strict mode). No `any` unless commented.
- **Money and weight are integers, never floats** (section 4). Any floating-point arithmetic on kg, rupees or paisa is a bug.
- The calculation module in `shared/` is the single source of truth. The client and the API import the same file. Never duplicate the formula.
- Never put secrets in client code. Secrets live in Vercel environment variables only.
- Never hard-delete a slip. Slips are voided, not deleted.
- Mobile-first. The primary device is an iPhone (Safari, installed to Home Screen). Test at 390×844 and 430×932.
- Keep dependencies minimal. Every new dependency needs a one-line reason in the PR/commit message.
- All user-facing strings go through i18n (section 8). No hardcoded English in components.
- Commit after each phase with a clear message.

---

## 1. Product summary

A phone app for wholesale agricultural markets (*mandis*). The user types each bag's weight as it is weighed. The app keeps a live total, converts to Mann (1 Mann = 40 kg), computes the amount at the day's rate, and produces a slip that can be shared or printed. Works offline. Syncs slips to an online database when connected. English and Urdu.

**Core formula**

```
amount = net_kg × rate_per_mann ÷ 40
net_kg = gross_kg − (tare_per_bag_kg × bag_count)
```

Worked example (must pass as a test): bags 55, 54, 50, 58, 60 kg → 277 kg; rate Rs. 2,000 per Mann → **Rs. 13,850**.

**Non-goals for v1**: Bluetooth thermal printing, daily summary dashboard, multi-user logins/roles, inventory, accounting, payments.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React 18 + TypeScript, Tailwind CSS |
| Routing | `react-router-dom` (hash or browser router; see PWA note) |
| State | React state + small hooks; `zustand` only if prop-drilling gets painful |
| Local storage | IndexedDB via `idb` (slips, queue, settings). `localStorage` only for UI prefs (language) |
| PWA | `vite-plugin-pwa` (Workbox), manifest, iOS meta tags |
| Slip image | `html-to-image` (`toPng`) |
| Fonts | Inter (`@fontsource/inter`), Noto Nastaliq Urdu (`@fontsource/noto-nastaliq-urdu`), self-hosted, no CDN |
| Backend | Vercel serverless functions in `/api` (Node runtime, TypeScript) |
| Database | Neon Postgres via `@neondatabase/serverless` |
| Validation | `zod` (shared schemas in `shared/`) |
| Auth | PIN → signed JWT (`jose`, HS256), stored in IndexedDB, sent as `Authorization: Bearer` |
| IDs | `ulid` generated on the client |
| Tests | Vitest (unit + API handlers), Playwright (e2e, optional but recommended) |
| Lint/format | ESLint + Prettier |
| Hosting | Vercel (static build + `/api`) |

---

## 3. Repository layout

```
/
├─ PLAN.md
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ vercel.json
├─ .env.example
├─ public/
│  ├─ icons/ (192, 512, maskable-512, apple-touch-icon-180)
│  └─ favicon.svg
├─ shared/
│  ├─ calc.ts            # integer math, the single formula
│  ├─ calc.test.ts
│  ├─ decimal.ts         # parseDecimal / formatDecimal (string <-> integer)
│  ├─ schema.ts          # zod schemas for slip payloads
│  └─ types.ts
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ routes/
│  │  ├─ Login.tsx
│  │  ├─ Weigh.tsx       # main screen
│  │  ├─ History.tsx
│  │  ├─ SlipView.tsx
│  │  └─ Settings.tsx
│  ├─ components/
│  │  ├─ WeightInput.tsx
│  │  ├─ BagChips.tsx
│  │  ├─ TotalsBar.tsx
│  │  ├─ ExtrasPanel.tsx
│  │  ├─ SlipCard.tsx    # the renderable slip (en/ur)
│  │  ├─ SyncBadge.tsx
│  │  └─ LangToggle.tsx
│  ├─ lib/
│  │  ├─ db.ts           # idb setup
│  │  ├─ sync.ts         # upload queue
│  │  ├─ api.ts          # fetch wrapper with auth
│  │  ├─ slipImage.ts    # toPng, share, download
│  │  └─ i18n.ts
│  ├─ i18n/
│  │  ├─ en.json
│  │  └─ ur.json
│  └─ styles/index.css
├─ api/
│  ├─ _lib/ (db.ts, auth.ts, ratelimit.ts, csv.ts)
│  ├─ auth/login.ts
│  ├─ slips/index.ts         # GET list, POST batch upsert
│  ├─ slips/[id]/void.ts     # POST void
│  └─ slips/export.ts        # GET CSV
├─ db/
│  └─ schema.sql
└─ e2e/ (Playwright specs)
```

---

## 4. Number handling (critical)

**Representation (all integers)**

| Quantity | Stored as | Example |
|---|---|---|
| Weight | grams (int) | 55 kg → `55000` |
| Rate per Mann | paisa (int) | Rs. 2,000 → `200000` |
| Money amounts | paisa (int) | Rs. 13,850 → `1385000` |
| Percent | hundredths of a percent (int) | 2.5% → `250` |

- Inputs accept up to **2 decimal places** for kg and rupees, and 2 for percent. Parse from the *string* typed by the user (`parseDecimal(str, dp)`), never through `parseFloat` and multiplication.
- Reject: empty, negative, zero (for weights), more than 2 dp, NaN, weights above `MAX_BAG_KG` (setting, default 1000).

**Formulas** (`shared/calc.ts`)

```ts
const MANN_G = 40_000; // 40 kg in grams

grossG    = sum(weightsG)
tareG     = tarePerBagG * bagCount
netG      = grossG - tareG                       // must be > 0, else error
amountP   = roundHalfUp(netG * ratePaisa / MANN_G)   // paisa

commissionP = commission.type === 'percent'
  ? roundHalfUp(amountP * commission.hundredthsPct / 10_000)
  : commission.paisa
labourP = labour.type === 'perBag' ? labour.paisa * bagCount : labour.paisa  // 'fixed' => labour.paisa

chargesP = commissionP + labourP
totalP   = chargeMode === 'add' ? amountP + chargesP : amountP - chargesP
totalRupees = roundToRupee ? roundHalfUp(totalP / 100) : totalP / 100
```

- `roundHalfUp` operates on integers via integer division (no float). Max safe range: `netG × ratePaisa` stays below 2^53 for realistic values (guard with explicit limits: net ≤ 100,000,000 g, rate ≤ 10,000,000 paisa). Use `BigInt` if limits are raised.
- `roundToRupee` is a setting, default **true**. The weight is **never** rounded. The slip must always show the exact weight.
- `chargeMode` (`'add' | 'deduct'`) is a setting. Default `'add'`. **Open question for the client** (section 15): whether charges are added to the buyer's bill or deducted from the seller's.
- If `totalP < 0`, return an error state; the UI blocks saving.

**Required test vectors** (`shared/calc.test.ts`)

| # | Weights (kg) | Rate | Tare/bag | Commission | Labour | Mode | Expected total |
|---|---|---|---|---|---|---|---|
| 1 | 55, 54, 50, 58, 60 | 2000 | 0 | — | — | — | **13,850** (gross 277 kg) |
| 2 | same | 2000 | 1 kg | — | — | — | **13,600** (net 272 kg) |
| 3 | same | 2000 | 0 | 2% | — | add | **14,127** (commission 277) |
| 4 | same | 2000 | 0 | 2% | — | deduct | **13,573** |
| 5 | same | 2000 | 0 | — | 10 per bag | add | **13,900** (labour 50) |
| 6 | 50.5, 49.75 | 1999.50 | 0 | — | — | — | amount 5,011.25 → **5,011** rounded to rupee |
| 7 | 50.5, 49.75 | 1999.50 | 0 | — | — | — | with `roundToRupee=false` → **5,011.25** |

Also test: input parsing edge cases (`"55."`, `".5"`, `"55.123"`, `"-3"`, `"0"`, `"1e3"`, `"٥٥"` Urdu digits normalised or rejected consistently), zero-bag state, net weight ≤ 0, and that client and API produce identical results for random inputs (property test with a fixed seed).

---

## 5. Database (Neon Postgres)

`db/schema.sql`:

```sql
create table if not exists slips (
  id              text primary key,                 -- client-generated ULID (idempotency key)
  slip_code       text not null,                    -- human-readable, e.g. 1010-7K3F
  created_at      timestamptz not null,             -- device time
  received_at     timestamptz not null default now(),
  device_id       text,
  seller          text,
  buyer           text,
  note            text,
  bag_count       int    not null check (bag_count > 0),
  gross_g         bigint not null check (gross_g > 0),
  tare_per_bag_g  int    not null default 0 check (tare_per_bag_g >= 0),
  net_g           bigint not null check (net_g > 0),
  rate_paisa      bigint not null check (rate_paisa >= 0),
  amount_paisa    bigint not null,
  commission_type text check (commission_type in ('percent','fixed')),
  commission_value bigint,                          -- hundredths of pct, or paisa
  commission_paisa bigint not null default 0,
  labour_type     text check (labour_type in ('fixed','perBag')),
  labour_value    bigint,                           -- paisa
  labour_paisa    bigint not null default 0,
  charge_mode     text not null default 'add' check (charge_mode in ('add','deduct')),
  round_to_rupee  boolean not null default true,
  total_paisa     bigint not null,
  total_rupees    bigint not null,
  lang            text not null default 'en' check (lang in ('en','ur')),
  voided_at       timestamptz,
  void_reason     text
);

create table if not exists bag_weights (
  slip_id text not null references slips(id) on delete cascade,
  seq     int  not null,
  grams   int  not null check (grams > 0),
  primary key (slip_id, seq)
);

create index if not exists slips_created_idx on slips (created_at desc);
create index if not exists slips_seller_idx  on slips (lower(seller));
create index if not exists slips_buyer_idx   on slips (lower(buyer));

create table if not exists login_attempts (
  id bigserial primary key,
  ip text not null,
  at timestamptz not null default now(),
  ok boolean not null
);
create index if not exists login_attempts_ip_at on login_attempts (ip, at desc);
```

Notes:
- Run the schema once via the Neon SQL editor (document this in the README). Do not run migrations from serverless functions at request time.
- `bag_weights` and `slips` are written in a single transaction.
- `slip_code` format: `MMDD-XXXX`, where `XXXX` is the last 4 characters of the ULID (uppercase, ambiguous characters removed). Show it on the slip.

---

## 6. API contract (`/api`)

All responses are JSON except CSV. All routes except `/api/auth/login` require `Authorization: Bearer <jwt>`. Validate every body and query with zod. Return `{ error: { code, message } }` on failure.

### `POST /api/auth/login`
Body: `{ pin: string }`
- Compare to `process.env.APP_PIN` with `crypto.timingSafeEqual` (hash both with SHA-256 first so lengths match).
- Throttle: if ≥5 failed attempts from the same IP in the last 15 minutes → `429`. Log every attempt in `login_attempts`.
- Success → `{ token, expiresAt }`. JWT claims: `sub: "shop"`, `iat`, `exp` = 30 days, signed with `AUTH_SECRET`.
- Deliberately generic error: `401 { code: "invalid_pin" }`.

### `POST /api/slips`
Body: `{ slips: SlipPayload[] }` (max 50 per request).

`SlipPayload`:
```ts
{
  id: string;               // ULID
  createdAt: string;        // ISO 8601
  deviceId?: string;
  seller?: string; buyer?: string; note?: string;   // max 120 / 120 / 500 chars
  weightsG: number[];       // ints, in entry order
  ratePaisa: number;
  tarePerBagG: number;
  commission?: { type: 'percent'; hundredthsPct: number } | { type: 'fixed'; paisa: number };
  labour?: { type: 'fixed' | 'perBag'; paisa: number };
  chargeMode: 'add' | 'deduct';
  roundToRupee: boolean;
  lang: 'en' | 'ur';
}
```
Server behaviour:
1. Recompute everything with `shared/calc.ts`. **Ignore any totals the client might send.** Store the server-computed values.
2. `INSERT ... ON CONFLICT (id) DO NOTHING` so retries never duplicate.
3. Response: `{ results: [{ id, status: 'created' | 'exists' | 'rejected', error? }] }`. A rejected slip must not block the others.
4. Idempotent and safe to call repeatedly.

### `GET /api/slips?from=&to=&q=&cursor=&limit=`
- Newest first, cursor pagination on `(created_at, id)`, default limit 30, max 100.
- `q` matches seller, buyer, slip_code (case-insensitive).
- Returns slips with `weightsG` included.

### `POST /api/slips/:id/void`
Body: `{ reason: string }` (min 3 chars). Sets `voided_at` and `void_reason`. Voiding an already-voided slip is a no-op returning 200.

### `GET /api/slips/export?from=&to=`
CSV, UTF-8 with BOM (so Excel opens Urdu names correctly). Columns: `slip_code, created_at, seller, buyer, bag_count, weights_kg, gross_kg, tare_kg, net_kg, rate_per_mann, amount, commission, labour, charge_mode, total, voided, note`. Escape quotes and neutralise formula injection (prefix cells starting with `= + - @` with `'`).

### Security headers (`vercel.json`)
`Content-Security-Policy` (self only, plus `data:` and `blob:` for images), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` minimal. No CORS headers (same origin only). Cache: `no-store` on `/api/*`.

---

## 7. Environment variables

`.env.example`:
```
DATABASE_URL=          # Neon connection string (set by Vercel–Neon integration)
APP_PIN=               # at least 8 characters
AUTH_SECRET=           # 32+ random bytes, base64
```
Never commit real values. The README must explain how to generate `AUTH_SECRET` (`openssl rand -base64 32`) and set the three variables in Vercel.

---

## 8. Languages (i18n)

- Two JSON files, `en.json` and `ur.json`, flat key namespace, typed keys (a TS type derived from `en.json`; build fails if `ur.json` is missing a key).
- Language stored in `localStorage` and in settings; toggle is always visible in the header.
- On switch: set `<html lang="ur" dir="rtl">` or `lang="en" dir="ltr"`. Use Tailwind logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `text-start`) instead of `ml-`/`mr-`/`text-left`. Mirror directional icons.
- Urdu font: Noto Nastaliq Urdu for Urdu text, with **larger line-height (≈1.9)** because Nastaliq has tall ascenders/descenders. Numbers use Inter (Western digits) in both languages. Digits stay Western. This is a confirmed default and can be changed later.
- User-entered text (seller, buyer, note) renders with `dir="auto"` so mixed content displays correctly.
- Provide **complete Urdu translations** for every key. Where wording is uncertain, use common mandi terminology: Mann (من), bardana (باردانہ), arhat/commission (کمیشن), labour (مزدوری), seller (فروخت کنندہ), buyer (خریدار), total (کل), bags (بوری). Flag every Urdu string in a `ur.review.md` file so a native speaker can review before release.

---

## 9. Screens and behaviour

### 9.1 Login
PIN field (password type), "Unlock" button, error text, 429 handling with a "try again in N minutes" message. Token stored in IndexedDB. On `401` from any API call, clear the token and return to Login without losing unsynced slips.

### 9.2 Weigh (home)
Layout, top to bottom (single column, thumb-reachable):
1. Header: app name, language toggle, sync badge.
2. **Weight input** (`inputMode="decimal"`, font-size ≥16px to prevent iOS zoom, auto-focus) and a large **+ Add** button. `Enter` also adds. After adding, clear and refocus.
3. **Bag chips**: scrollable wrap of added weights, newest last. Tap a chip → remove (with an undo toast for 5 s). "Undo last" button.
4. **Totals bar** (sticky above the bottom actions): bags, gross kg, net kg (only if tare on), Mann equivalent (net ÷ 40, 3 dp), **Rate per Mann** input, **Total payable**.
5. **Extras panel** (collapsed by default; each toggle off by default): tare per bag, commission (percent/fixed), labour (fixed/per bag), seller, buyer, note.
6. Actions: **Save & show slip**, **Reset** (two-tap confirm, no `confirm()` dialogs).

Rules:
- The default rate is remembered from settings; the last-used rate pre-fills.
- Save is disabled when there are no bags, the rate is empty, or the result is invalid. Show the reason inline.
- Show the exact formula result live; no debouncing needed.
- Guard against double-tap adding the same weight twice within 300 ms only if the input value is unchanged.
- Duplicate weight values are valid (many bags weigh the same). Do not de-duplicate.
- Keep the screen awake while on this screen (Screen Wake Lock API, optional, tolerate rejection).
- Respect iPhone safe areas (`env(safe-area-inset-*)`).

### 9.3 Slip view
Shows the rendered slip (section 10), with buttons: **Share** (Web Share with an image file; fallback: download), **Save image**, **Language** (re-render slip in the other language), **New weighing**. The slip is saved to IndexedDB **before** this screen shows, and queued for sync.

### 9.4 History
Reverse-chronological list from IndexedDB merged with server results (when online), with sync status per row (pending / synced). Search by seller, buyer, code. Tap → slip view. Voided slips show a "Void" tag and are excluded from totals. A **Void** action requires a reason typed in an inline field. **Export CSV** button (online only) downloads via `GET /api/slips/export`; since downloads from a PWA can be awkward on iPhone, open it through the share sheet where possible.

### 9.5 Settings
Shop name (printed on slip), default rate, default tare, which extras are available, charge mode, round-to-rupee toggle, slip width (58 mm / 80 mm), language, **Export backup (JSON)**, **Import backup (JSON)**, Lock (clears token), app version, last sync time.

---

## 10. Slip rendering

- Component `SlipCard` renders at a fixed CSS width: **384 px for 58 mm**, **576 px for 80 mm** (thermal printer dot widths). Export with `toPng` at `pixelRatio: 2`, white background.
- Monospace-ish alignment is not required; use a clean sans layout with high contrast (thermal printers dither images, so no light greys and no fine hairlines thinner than 2 px).
- Content order:
  1. Shop name (bold, centred)
  2. Slip code and date/time (device local time, `en-GB` style `10 Oct 2026, 1:15 PM`)
  3. Seller / buyer (only if provided)
  4. Divider
  5. Weights grid, **5 per row** (kg values), RTL-aware in Urdu
  6. Divider
  7. Bags · Gross kg · (Tare kg · Net kg only if tare used) · Rate per Mann · Mann equivalent
  8. Amount
  9. Commission and labour lines (only if used), labelled "added" or "deducted"
  10. **TOTAL PAYABLE** (largest type)
  11. Note (if any)
  12. Footer: "1 Mann = 40 kg"
- Never show rounded weight. If the total was rounded to the rupee, no extra note is needed; the total is the billed figure.
- Urdu version mirrors the structure with Nastaliq labels.
- Share flow: `navigator.canShare({ files })` → `navigator.share`. Fallback: open the PNG in a new tab so the user can long-press → Save/Print, and offer a download link.
- Printing: iPhone AirPrint via the share sheet's Print. Direct Bluetooth printing is out of scope (iOS Safari has no Web Bluetooth).

---

## 11. Offline-first storage and sync

**IndexedDB** (`idb`), database `mandi`:
- `slips` store: `{ id, payload, createdAt, syncStatus: 'pending' | 'synced' | 'rejected', syncError?, syncedAt?, voided?: {at, reason, syncStatus} }`
- `settings` store: single record.
- `auth` store: `{ token, expiresAt }`.

**Write path:** Save → write the slip to IndexedDB with `pending` → show slip → trigger sync. The user never waits on the network.

**Sync worker** (`lib/sync.ts`):
- Triggers: app start, `online` event, after each save, `visibilitychange` to visible, and every 60 s while visible.
- Batch pending slips (max 50), `POST /api/slips`, update statuses from the per-slip result. `exists` counts as synced.
- Failure handling: network error → keep pending, exponential backoff (cap 5 min). `401` → stop and require login. `429/5xx` → backoff. `rejected` → mark `rejected` with the server's message, surface it in History so the user can see it. Never drop a slip silently.
- Single-flight: only one sync run at a time.
- Pending voids sync the same way.

**Device ID:** random UUID created on first launch, stored in settings, sent with each slip.

**Backup:** JSON export contains all local slips and settings (excluding the auth token). Import merges by `id` (never overwrites an existing slip).

**iOS storage note:** install via **Add to Home Screen** (Safari can evict site data for sites not used in 7 days; installed PWAs are exempt). Show a one-time hint banner on iOS Safari when not in standalone mode.

---

## 12. PWA

- `vite-plugin-pwa`, `registerType: 'prompt'` (show an "Update available" toast; do not auto-reload mid-weighing).
- Precache the app shell and fonts. **Do not cache `/api/*`.**
- Manifest: `name`, `short_name: "Mandi"`, `display: "standalone"`, `start_url: "/"`, `background_color` and `theme_color` matching the palette, icons 192/512 + maskable.
- iOS meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` (180×180), viewport with `viewport-fit=cover`.
- Test: with the network disabled, the app loads, bags can be added, a slip can be saved and shown, and it syncs after reconnecting.

---

## 13. Visual design

- Palette: deep forest green `#1E3A2B` (primary), moss `#3E6B4F`, wheat gold `#C9962F` (accent/CTA), cream `#F7F2E7` (surface), ink `#1F2421`, mist `#6B756E`. Define as CSS variables / Tailwind theme tokens. Support light and dark; dark uses deeper greens and keeps gold as the accent.
- Type: Inter for UI, tabular numerals (`font-variant-numeric: tabular-nums`) for all weights and money. Noto Nastaliq Urdu for Urdu text.
- Big touch targets (≥48 px), high contrast, one-hand reach. The weight input and **+ Add** are the largest elements on screen. The total payable is the most prominent figure.
- No emoji as UI markers. No decorative animation beyond subtle transitions; respect `prefers-reduced-motion`.
- Empty state on Weigh: a short line explaining "Type a weight and press Add".

---

## 14. Phases (each is one agent mission)

Each phase ends with its **Verify** list passing before moving on.

### Phase 1 — Project scaffold and calculation engine
**Do:** Scaffold Vite + React + TS + Tailwind, ESLint/Prettier, Vitest. Implement `shared/decimal.ts`, `shared/calc.ts`, `shared/types.ts`, and all tests in section 4.
**Verify:** `npm test` passes all 7 vectors and the edge-case/property tests. `npm run build` succeeds.

### Phase 2 — Weigh screen
**Do:** WeightInput, BagChips, TotalsBar, ExtrasPanel, Reset/Undo behaviour, settings stub (default rate, extras toggles), safe-area handling.
**Verify:** In the browser at 390×844: enter 55, 54, 50, 58, 60 using only the keyboard (Enter) → total shows 277 kg and Rs. 13,850. Chip removal and undo work. Toggling tare/commission/labour matches vectors 2–5. Screenshot attached.

### Phase 3 — i18n and slip
**Do:** i18n infrastructure, `en.json`/`ur.json`, RTL layout, fonts, `SlipCard`, `slipImage.ts` (PNG, share, download), SlipView screen.
**Verify:** Toggle to Urdu → layout mirrors, Nastaliq text is not clipped, numbers remain Western. Slip renders at 58 mm and 80 mm widths in both languages. PNG exports and downloads. Screenshots of both slips attached.

### Phase 4 — Local persistence and History
**Do:** IndexedDB layer, save flow, History list, search, void (local), settings screen with JSON backup export/import.
**Verify:** Reload the page mid-weighing and after saving → data survives. Export JSON, wipe IndexedDB, import → slips restored without duplicates.

### Phase 5 — Backend and sync
**Do:** `db/schema.sql`, API routes, auth with throttling, zod validation, server-side recompute, CSV export, sync worker, SyncBadge, Login screen, security headers, README with Neon + Vercel setup.
**Verify:** API tests with the Neon driver mocked: idempotent re-POST returns `exists`; a tampered client total is ignored; wrong PIN ×5 → 429; CSV neutralises `=cmd`; void is idempotent. Local manual test with a real Neon branch DB if a `DATABASE_URL` is available (otherwise state clearly that it was not tested against a live database).

### Phase 6 — PWA, offline and polish
**Do:** `vite-plugin-pwa`, icons, iOS meta tags, update prompt, iOS install hint, wake lock, empty/error states, accessibility pass (labels, focus order, contrast), performance pass.
**Verify:** Lighthouse PWA/installability checks pass. Offline flow (section 12) works end-to-end in the browser with the network disabled. Playwright e2e covers: weigh → save → slip; language toggle; offline save then sync after reconnect (API mocked).

### Phase 7 — Hand-over
**Do:** README (setup, env vars, Neon schema, deploy to Vercel, "Add to Home Screen" instructions with screenshots), `ur.review.md`, a short `CHANGELOG.md`, and a manual test checklist for the client.
**Verify:** A person following only the README can deploy from scratch.

---

## 15. Open questions (confirm with the client before Phase 3/5)

1. **Charge mode:** are commission and labour *added* to the buyer's bill or *deducted* from the seller's payment? (Default implemented: add; configurable.)
2. **Rounding:** final total rounded to the nearest rupee (default on) or shown in paisa?
3. **Digits in Urdu mode:** Western (1, 2, 3 — default) or Urdu-Indic (۱، ۲، ۳)?
4. **Slip width** to default to (58 mm or 80 mm), pending the printer purchase.
5. **Extras the client actually needs** beyond the list (e.g. a second weight unit, vehicle number, item/crop name). Each is an additive column.
6. **Maximum single bag weight** (default 1000 kg).

---

## 16. Acceptance criteria (definition of done)

- [ ] All 7 calculation vectors pass; client and server results are identical for random inputs.
- [ ] 55/54/50/58/60 at Rs. 2,000 shows **277 kg** and **Rs. 13,850** on screen and on the slip.
- [ ] Works fully offline; slips sync after reconnecting; no duplicates on retry.
- [ ] No slip is ever lost: closing the app, refreshing, or losing signal mid-sync keeps it pending.
- [ ] English and Urdu complete, RTL correct, Nastaliq not clipped, user text renders with `dir="auto"`.
- [ ] Slip image shares through the iOS share sheet; shows exact weight; correct in both languages.
- [ ] PIN required; ≥5 wrong attempts throttle; no secrets in the client bundle (grep the build output for `APP_PIN`, `AUTH_SECRET`, `DATABASE_URL`).
- [ ] CSV export opens in Excel with correct Urdu text and no formula injection.
- [ ] Installable on iPhone Home Screen; layout respects safe areas; inputs do not trigger iOS zoom.
- [ ] `npm run lint`, `npm test`, and `npm run build` all pass with no warnings introduced.
- [ ] README lets a non-author deploy from scratch.

---

## 17. Paste-ready mission prompts

**Kickoff (Planning mode):**
> Read PLAN.md fully. Do not write code yet. Produce an implementation plan covering Phase 1–7, list any ambiguities or risks you see in the plan, and wait for my approval.

**Per phase:**
> Execute Phase N from PLAN.md exactly as written. Follow section 0 rules. When done, run every item in the phase's Verify list, attach evidence (test output, screenshots at 390×844), and stop. Do not start Phase N+1.

**Browser verification (Phases 2, 3, 6):**
> Open the dev server in the browser at 390×844. Enter weights 55, 54, 50, 58, 60 using only the keyboard, set the rate to 2000, confirm the total reads Rs. 13,850, switch language to Urdu, confirm RTL layout and no clipped text, then save a screenshot of each step.
