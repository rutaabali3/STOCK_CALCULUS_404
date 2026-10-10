# Changelog

All notable changes to the Mandi Weighment & Cost Calculator project are documented here.

## [1.0.0] - 2026-10-11

### Added
- **Core Calculation Engine**:
  - Pure integer arithmetic module in `shared/calc.ts` eliminating floating-point rounding errors.
  - Weights handled in integer grams; currency handled in integer paisa.
  - Safe `BigInt` overflow guard for arbitrarily large bulk weighments.
  - Exact string-to-integer parser `parseDecimal` and formatter `formatDecimal` in `shared/decimal.ts`.
  - Comprehensive unit test suite covering all 7 required mandi test vectors and property-based determinism tests.
- **Weigh Screen (Core UI)**:
  - High-speed numeric keypad input with 300ms duplicate entry guard.
  - Wrapping bag chips with single-tap removal and 5-second undo toast.
  - Sticky live totals bar showing Bag Count, Gross Weight, Net Weight, Mann conversion ($1\text{ Mann} = 40\text{ kg}$), and Total Payable.
  - Collapsible extras panel for Tare deduction, Commission (`%` or `Rs.`), Labour (`Per Bag` or `Fixed`), Seller/Buyer names, and remarks.
  - Screen Wake Lock API integration to keep screen active during market weighing.
  - Safe two-tap reset flow.
- **Slip Rendering & Sharing**:
  - Dual-mode thermal receipt rendering: **58 mm (384 px)** and **80 mm (576 px)** modes in `SlipCard.tsx`.
  - High-resolution receipt PNG generation via `html-to-image` at `pixelRatio: 2`.
  - Cross-platform Web Share API integration with automatic fallback to direct download.
- **Offline Persistence & Local History**:
  - IndexedDB storage layer (`idb`) for immediate offline slip commits.
  - Reverse-chronological history list with live search filtering by seller, buyer, or slip code.
  - Soft-voiding flow with audit reason capture (slips are never hard-deleted).
  - Full JSON backup export and safe-merge restore.
- **Backend & Background Sync**:
  - Neon Postgres schema with relational `slips`, `bag_weights`, and rate-limiting `login_attempts` tables.
  - Constant-time PIN authentication with IP-based brute-force throttling ($\ge 5$ failed attempts $\to$ 429).
  - Batch slip upsert with server-side recalculation override and conflict-free idempotency.
  - UTF-8 CSV export with Byte Order Mark (BOM) and formula injection sanitization.
  - Background sync worker triggered by online events, app startup, post-save actions, and visibility changes.
- **Cross-Platform PWA**:
  - Workbox service worker precaching all app shell assets and fonts.
  - Native `beforeinstallprompt` installation banner for Android and desktop browsers.
  - Guided "Add to Home Screen" banner for iOS Safari.
  - Non-disruptive update toast for seamless background service worker updates.
