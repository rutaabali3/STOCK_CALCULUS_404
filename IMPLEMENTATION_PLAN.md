# Mandi Weighment & Cost Calculator — Implementation Plan (English-Only & Global Cross-Platform)

> Refined implementation plan based on [PLAN.md](file:///c:/Users/Fahad/OneDrive/Music/mandi%20calculator/PLAN.md) incorporating all user specifications:
> - **English-only**: All Urdu translation, RTL layout, Nastaliq font, and i18n layers removed for simplicity and performance.
> - **Cross-platform**: First-class experience across all devices (Android, iOS Safari, desktop browsers).
> - **Weight limits**: No upper cap on single bag weight; safe BigInt guard prevents integer overflow.
> - **Configurable settings**: Charge mode (add / deduct), rounding (nearest rupee / paisa), and slip width (58 mm / 80 mm / 90 mm).
> - **Clean v1**: No clutter or unnecessary extra fields.

---

## 1. Overview & Architecture

A fast, mobile-first, offline-ready **cross-platform PWA** tailored for agricultural markets (*mandis*).
- **Core Workflow**: Quick bag entry $\to$ live totals in Mann ($1\text{ Mann} = 40\text{ kg}$) and payable Rupees $\to$ one-tap save $\to$ high-contrast thermal-ready slip PNG / PDF $\to$ share / print.
- **Offline-First**: IndexedDB via `idb` stores slips, settings, and credentials immediately. Background worker syncs to serverless Neon Postgres when network is available.
- **Precision Guarantee**: Integer arithmetic only (weights in grams, money in paisa). Never float.

---

## 2. Updated Phase Breakdown

### Phase 1 — Project Scaffold & Calculation Engine
**Goal**: Zero UI. Establish clean TypeScript strict toolchain and bulletproof integer calculation engine.

| Step | Action Details |
|---|---|
| 1.1 | Scaffold Vite + React 18 + TypeScript + Tailwind CSS (`strict: true`, no `any`). |
| 1.2 | Configure ESLint + Prettier + Vitest with path alias support (`shared/*`). |
| 1.3 | Implement `shared/types.ts`: Domain models (`SlipPayload`, `CalcInput`, `CalcResult`, charge/commission/labour structures). |
| 1.4 | Implement `shared/decimal.ts`: Exact string-to-integer conversions (`parseDecimal(str, dp)` and `formatDecimal(int, dp)`). Strict validation for negative numbers, scientific notation, and malformed inputs. No max bag weight cap. |
| 1.5 | Implement `shared/calc.ts`: The single source of truth for the Mandi formula. Integer math for gross weight, tare deduction, Mann conversion, rate calculations, commission, labour, and configurable rounding. Safe BigInt upgrade if numbers exceed `Number.MAX_SAFE_INTEGER`. |
| 1.6 | Implement `shared/schema.ts`: Zod schema for client and server payload validation. |
| 1.7 | Implement `shared/calc.test.ts`: Verify all required test vectors (1–7), boundary conditions, zero-bag error, and property tests. |

**Verification**: `npm test` passes all vectors and edge cases. `npm run build` succeeds cleanly.

---

### Phase 2 — Weigh Screen (Main Core UI)
**Goal**: Ergonomic, high-speed bag entry interface optimized for one-hand phone usage.

| Step | Action Details |
|---|---|
| 2.1 | Set up `react-router-dom` (HashRouter for PWA reliability) and viewport shell with safe-area padding (`env(safe-area-inset-*)`). |
| 2.2 | Define color tokens and styling (Forest green `#1E3A2B`, Moss `#3E6B4F`, Wheat Gold `#C9962F`, Cream `#F7F2E7`, Ink `#1F2421`, Mist `#6B756E`). Tabular numerals for all figures. |
| 2.3 | Build `WeightInput.tsx`: Auto-focusing numeric input (`inputMode="decimal"`, font-size $\ge 16\text{px}$ to prevent browser auto-zoom), large **+ Add** button, `Enter` key trigger, 300ms double-tap guard. |
| 2.4 | Build `BagChips.tsx`: Horizontal wrapping bag chips, tap to remove with a 5-second undo toast, and quick "Undo Last" button. |
| 2.5 | Build `TotalsBar.tsx`: Sticky live totals bar showing Bag Count, Gross Weight (kg), Net Weight (kg), Mann equivalent (3 decimal places), Rate per Mann input, and prominent **Total Payable**. |
| 2.6 | Build `ExtrasPanel.tsx`: Collapsible accordion for optional tare per bag, commission (percentage or fixed), labour (fixed or per bag), seller, buyer, note, and receipt/lot name. |
| 2.7 | Build `Settings` store & state: Default rate, default tare, charge mode (`add` vs. `deduct`), round-to-rupee toggle, default slip width. |
| 2.8 | Implement Screen Wake Lock API (`navigator.wakeLock`) with safe fallback for long weighing sessions. |
| 2.9 | Safe reset flow (two-tap confirmation without native popups). |

**Verification**: Tested on Android viewports (360×800, 412×915) and iOS (390×844). Fast numeric input adds bags 55, 54, 50, 58, 60 $\to$ exact 277 kg and Rs. 13,850.

---

### Phase 3 — Slip Rendering & Sharing (English-Only)
**Goal**: High-contrast, thermal-printer-compatible digital receipts with instant PNG / PDF generation and sharing.

| Step | Action Details |
|---|---|
| 3.1 | Self-host Inter font (`@fontsource/inter`) for crisp tabular numbers and clean UI. |
| 3.2 | Build `SlipCard.tsx`: Standard thermal receipt layout supporting **58 mm (384 px)**, **80 mm (576 px)**, and **90 mm (648 px)** modes. High-contrast monochrome formatting (no light grays, $\ge 2\text{px}$ lines for thermal clarity). Order: Shop name, Receipt Name (if set), Slip Code (`MMDD-XXXX`), Date/Time, Seller/Buyer, 5-column bag weights grid, Totals breakdown, and Large Total Payable. |
| 3.3 | Build `src/lib/slipImage.ts`: PNG generation via `html-to-image` at `pixelRatio: 2` with solid white background, plus offline PDF generation via `jspdf`. |
| 3.4 | Share integration: Cross-platform Web Share API (`navigator.share({ files: [...] })`) with seamless fallback to direct download and full-screen image view. |
| 3.5 | Build `SlipView.tsx` route: Actions for Share, Save PNG Image, Save PDF File, editable filename, and Start New Weighing. |

**Verification**: Slip renders accurately at 58 mm, 80 mm, and 90 mm; PNG and PDF download cleanly with sharp borders and legible figures.

---

### Phase 4 — Local Storage & History
**Goal**: Zero-data-loss offline persistence, local history, search, and backup.

| Step | Action Details |
|---|---|
| 4.1 | Set up IndexedDB via `idb` (`database: mandi`): Stores for `slips`, `settings`, and `auth`. Request persistent storage (`navigator.storage.persist()`). |
| 4.2 | Immediate save pipeline: Save on Weigh screen writes slip directly into IndexedDB marked `syncStatus: 'pending'` before transitioning to SlipView. |
| 4.3 | Build `History.tsx`: Reverse-chronological list of saved slips, search filtering by buyer/seller/code, sync status badges. |
| 4.4 | Implement Void flow: In-place void reason input (min 3 chars). Never hard-delete; flag record as `voided` with timestamp and reason. |
| 4.5 | Build `Settings.tsx`: Shop title, default rate, default tare, charge mode toggle, round-to-rupee toggle, default slip width, device ID display. |
| 4.6 | JSON Backup/Restore: Export full local dataset as JSON; import merging safely by ULID without overwriting. |

**Verification**: Page refresh or offline restart retains all in-progress and historical weighments. JSON export/wipe/import loop confirms zero data loss.

---

### Phase 5 — Backend & Sync Engine
**Goal**: Resilient serverless API endpoints, PIN authentication, and reliable background synchronization.

| Step | Action Details |
|---|---|
| 5.1 | Define `db/schema.sql` for Neon Postgres: `slips`, `bag_weights` (transactional write), and `login_attempts` tables. |
| 5.2 | Implement API authentication: `POST /api/auth/login` using constant-time hash comparison (`timingSafeEqual`), IP throttle ($\ge 5$ attempts / 15 mins $\to$ 429), signed JWT via `jose` (HS256). |
| 5.3 | Implement `POST /api/slips`: Batch upsert (up to 50 slips), server-side recomputation using `shared/calc.ts` (ignoring any tampered client totals), idempotent `ON CONFLICT (id) DO NOTHING`. |
| 5.4 | Implement `GET /api/slips`: Cursor-based pagination with search filtering. |
| 5.5 | Implement `POST /api/slips/:id/void`: Idempotent void endpoint. |
| 5.6 | Implement `GET /api/slips/export`: Export slips to CSV with UTF-8 BOM, sanitized against formula injection (`'` prefix on `= + - @`). |
| 5.7 | Build client sync worker `src/lib/sync.ts`: Single-flight queue syncing on startup, `online` event, post-save, visibility changes, and periodic 60s timer. Exponential backoff for network drops. |
| 5.8 | Build `SyncBadge.tsx`: Clean header status indicator (Synced, Pending count, Syncing, Error). |

**Verification**: Vitest mocks verifying PIN throttling, idempotent sync, recalculation override on tampered totals, and CSV formula neutralization.

---

### Phase 6 — PWA, Offline Capabilities & Global Compatibility
**Goal**: Installable on Android, iOS, and desktop browsers with full offline execution.

| Step | Action Details |
|---|---|
| 6.1 | Configure `vite-plugin-pwa` with Workbox precaching app shell and fonts (excluding `/api/*`). |
| 6.2 | Generate web manifest and universal app icons (192px, 512px, maskable-512px, apple-touch-icon-180px). |
| 6.3 | Implement cross-platform installation prompts: Native `beforeinstallprompt` banner for Android and Desktop Chrome/Edge; iOS Safari guide banner when not standalone. |
| 6.4 | Set mobile viewport and OS meta tags (`viewport-fit=cover`, theme colors). |
| 6.5 | Non-disruptive update notification toast (never auto-reloading during an active weighment). |
| 6.6 | Accessibility and keyboard verification: Screen readers, AA color contrast, responsive layout across various screen widths. |

**Verification**: Lighthouse PWA installability pass. Complete weighing and slip generation verified offline.

---

### Phase 7 — Handover & Documentation
**Goal**: Production-ready deployment guides and operational test scripts.

| Step | Action Details |
|---|---|
| 7.1 | Create comprehensive `README.md`: Environment setup (`APP_PIN`, `AUTH_SECRET`, `DATABASE_URL`), Neon DB initialization, Vercel deployment, and home-screen install instructions for Android and iPhone. |
| 7.2 | Create `CHANGELOG.md` and client manual test checklist. |
