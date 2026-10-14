&lt;div align=&quot;center&quot;&gt;

# MANDI WEIGHMENT & COST CALCULATOR

### Enterprise-Grade, Offline-First Progressive Web Application for Wholesale Agricultural Markets

[Live Deployment](https://www.google.com/search?q=https%3A%2F%2Fstock-calculus.vercel.app%2F)
[TypeScript](https://www.google.com/search?q=https%3A%2F%2Fwww.typescriptlang.org%2F)
[React](https://www.google.com/search?q=https%3A%2F%2Freact.dev%2F)
[Vite PWA](https://www.google.com/search?q=https%3A%2F%2Fvite-pwa-org.netlify.app%2F)
[Neon Postgres](https://www.google.com/search?q=https%3A%2F%2Fneon.tech%2F)
[Vitest](https://www.google.com/search?q=https%3A%2F%2Fvitest.dev%2F)
[License: MIT](https://www.google.com/search?q=.%2FLICENSE)

**Zero Floating-Point Arithmetic** &bull; **Instant IndexedDB Persistence** &bull; **Bidirectional Cloud Sync** &bull; **58mm / 80mm / 90mm Thermal Receipt Studio**

&lt;/div&gt;

> [!IMPORTANT]
> **Precision Financial Guarantee**: This system eliminates IEEE-754 floating-point arithmetic across the entire calculation pipeline. Every bag weight is processed strictly in integer **grams** ($1\text{ kg} = 1,000\text{ g}$) and every monetary figure is processed in integer **paisa** ($\text{Rs. } 1 = 100\text{ paisa}$) backed by arbitrary-precision `BigInt` guards. Client and serverless backend share the exact same deterministic calculation engine (`shared/calc.ts`).

## Executive Overview

Wholesale agricultural commodity markets (*ghalla mandis*) operate in high-tempo, high-glare environments where hundreds of commodity bags are weighed sequentially on platform scales, converted into traditional **Mann** units ($1\text{ Mann} = 40\text{ kg}$), adjusted for bag tare weight, commission (*arhat*), and labour (*mazdoori*), and settled on the spot.

**Mandi Weighment & Cost Calculator** (`STOCK_CALCULUS_404`) replaces error-prone pocket calculators and paper ledgers with a purpose-built, cross-platform **Progressive Web App (PWA)** engineered around four pillars:

1. **Deterministic `BigInt` Calculus**: Pure integer arithmetic with exact half-up rounding (`roundHalfUp`) prevents fractional paisa drift even on multi-ton bulk lots exceeding `Number.MAX_SAFE_INTEGER`.
2. **True Offline-First Resilience**: Every weighment slip is committed locally to browser `IndexedDB` (`mandi_db_v1`) with persistent storage protection before transitioning screens. Market traders can operate for days without cellular connectivity.
3. **Single-Flight Bidirectional Cloud Sync**: When connectivity is available, a background sync worker pushes pending local slips in batches of up to 50 to **Neon Serverless Postgres** (where the server independently recomputes and verifies every total) and pulls historical slips across authorized shop devices.
4. **High-Contrast Thermal & Digital Receipt Studio**: Generates crisp monochrome receipts calibrated to exact thermal printer dot widths (**58 mm / 384 px**, **80 mm / 576 px**, and **90 mm / 648 px**), exporting retina `pixelRatio: 2` PNGs and custom-dimension PDFs via native Web Share API or direct download.

## System Architecture & Data Flow

### End-to-End Application Topology

```mermaid
flowchart TB
    subgraph Client["Client PWA (React 18 + Vite + Material Design 3)"]
        UI["Weigh Screen & Numeric Keypad<br/>(300ms Duplicate Guard + Wake Lock)"]
        DEC["Decimal Parser & Formatter<br/>(shared/decimal.ts)"]
        CALC_C["Pure BigInt Calculation Engine<br/>(shared/calc.ts)"]
        IDB[("IndexedDB Local Store<br/>(mandi_db_v1: slips, settings, auth)")]
        SLIP["Thermal Receipt Studio<br/>(SlipCard.tsx + SlipCustomizeModal.tsx)"]
        EXP["Export & Share Pipeline<br/>(html-to-image PNG @ 2x + jsPDF + Web Share)"]
        SYNC["Background SyncWorker<br/>(src/lib/sync.ts)"]
    end

    subgraph Cloud["Vercel Serverless Functions (/api/*)"]
        AUTH["POST /api/auth/login<br/>(Timing-Safe SHA-256 + IP Rate Limit + HS256 JWT)"]
        UPSERT["POST /api/slips<br/>(Zod Validation + Server Recalculation)"]
        QUERY["GET /api/slips<br/>(Search & Pagination)"]
        VOID["POST /api/slips/[id]/void<br/>(Idempotent Soft-Void)"]
        CSV["GET /api/slips/export<br/>(UTF-8 BOM CSV + Formula Sanitizer)"]
    end

    subgraph Database["Neon Serverless Postgres"]
        PG_SLIPS[("Table: slips")]
        PG_BAGS[("Table: bag_weights")]
        PG_LOGIN[("Table: login_attempts")]
    end

    UI -->|"String Input (kg / Rs)"| DEC
    DEC -->|"Integer Grams & Paisa"| CALC_C
    CALC_C -->|"Live CalcResult"| UI
    CALC_C -->|"Commit LocalSlipRecord (ULID)"| IDB
    IDB -->|"Render SlipData"| SLIP
    SLIP -->|"58mm / 80mm / 90mm"| EXP
    IDB <-->|"Pending / Synced Records"| SYNC
    SYNC <-->|"Bearer JWT (Batch <= 50)"| UPSERT
    SYNC <-->|"Pull Cloud History"| QUERY
    AUTH <-->|"Throttle Check & Audit"| PG_LOGIN
    UPSERT -->|"Transactional Insert (ON CONFLICT DO NOTHING)"| PG_SLIPS
    UPSERT -->|"Ordered Bag Sequence"| PG_BAGS
    QUERY <--> PG_SLIPS
    QUERY <--> PG_BAGS
    VOID --> PG_SLIPS
    CSV <--> PG_SLIPS
```

### Offline-First Slip Lifecycle & Sync State Machine

```mermaid
stateDiagram-v2
    [*] --> Weighing: Enter Bag Weights (kg) & Rate (Rs/Mann)
    Weighing --> LocalCommit: Tap "Save & Show Slip"
    LocalCommit --> Pending: Write to IndexedDB (ULID + syncStatus = 'pending')
    Pending --> Syncing: Trigger (Online / App Focus / 60s Timer / Manual)
    Syncing --> Synced: Server Recomputes & Returns 'created' or 'exists'
    Syncing --> Rejected: Validation or DB Constraint Failure
    Rejected --> Pending: User Taps "Retry" or "Retry All Rejected"
    Synced --> Voided: User Submits Mandatory Void Reason (>= 3 chars)
    Pending --> Voided: Offline Soft-Void (Preserves Original Record)
```

## Comprehensive Feature Matrix

| Capability Domain | Technical Implementation | Operational Benefit in the Mandi |
| :--- | :--- | :--- |
| **Zero-Float Arithmetic** | `BigInt` scaled integers (`grams` at $10^3$, `paisa` at $10^2$, `hundredthsPct` at $10^2$) in [shared/calc.ts](https://www.google.com/search?q=.%2Fshared%2Fcalc.ts) | Eliminates `0.1 + 0.2 !== 0.3` rounding discrepancies across all currency and weight totals |
| **High-Speed Bag Entry** | Auto-focused `inputMode="decimal"` field with `Enter` key trigger and `300 ms` identical-value debounce in [WeightInput.tsx](https://www.google.com/search?q=.%2Fsrc%2Fcomponents%2FWeightInput.tsx) | Prevents accidental double-taps on touchscreens while allowing rapid sequential entry of identical bag weights after 300ms |
| **Interactive Bag Stream** | Wrapping chip grid with one-tap removal, `5,000 ms` undo snackbar, and stack-based **Undo Last** in [BagChips.tsx](https://www.google.com/search?q=.%2Fsrc%2Fcomponents%2FBagChips.tsx) | Instant correction of misweighed bags without losing position in a 50+ bag lot |
| **Screen Wake Lock** | Native `navigator.wakeLock.request('screen')` lifecycle hook in [Weigh.tsx](https://www.google.com/search?q=.%2Fsrc%2Froutes%2FWeigh.tsx) | Keeps phone display active while the scale operator weighs bags hands-free |
| **Flexible Market Deductions** | Per-bag Tare (`kg`), Commission (`%` or fixed `Rs.`), Labour (`Per Bag` or fixed `Rs.`), and Charge Mode (`Add` for buyer / `Deduct` for seller) | Adapts to both buyer-side billing (*kacha parcha*) and seller-side net payout (*pakka parcha*) |
| **Multi-Width Thermal Studio** | Pixel-locked layout in [SlipCard.tsx](https://www.google.com/search?q=.%2Fsrc%2Fcomponents%2FSlipCard.tsx) supporting **58 mm** (`384 px`), **80 mm** (`576 px`), and **90 mm** (`648 px`) | Matches standard Bluetooth portable thermal printers as well as wide desktop POS rolls |
| **Live Slip Customization** | 3-tab [SlipCustomizeModal.tsx](https://www.google.com/search?q=.%2Fsrc%2Fcomponents%2FSlipCustomizeModal.tsx) with 10 section toggles, 3 font scales (`sm`, `base`, `lg`), and Compact Paper-Saving Mode | Lets shops tailor branding, hide internal lines, or compress vertical spacing to save thermal paper |
| **Dual PNG & PDF Export** | `html-to-image` (`pixelRatio: 2`, solid `#FFFFFF` canvas) + proportional `jsPDF` generator in [slipImage.ts](https://www.google.com/search?q=.%2Fsrc%2Flib%2FslipImage.ts) | Produces razor-sharp receipts that never crop on narrow mobile screens and share directly to WhatsApp |
| **Soft-Void Audit Trail** | Idempotent voiding in [History.tsx](https://www.google.com/search?q=.%2Fsrc%2Froutes%2FHistory.tsx) and `POST /api/slips/[id]/void` requiring a minimum 3-character reason | Prevents silent deletion of financial records; voided slips display a `VOID` badge and strikethrough total |
| **Server-Side Recalculation** | `POST /api/slips` ignores client-submitted totals and recomputes `CalcResult` from raw `weightsG` and `ratePaisa` | Guarantees database integrity even if client payloads are tampered with in transit |
| **Constant-Time PIN Security** | SHA-256 `crypto.timingSafeEqual` PIN verification + IP rate limiting ($\ge 5$ failures in 15 min $	o$ HTTP `429`) + 30-day `HS256` JWT | Protects private shop data against timing attacks and brute-force PIN guessing |
| **Sanitized CSV & JSON Backups** | Cloud CSV export with UTF-8 BOM (`\uFEFF`) and formula injection guard (`'` prefix on `=`, `+`, `-`, `@`) + local JSON export/import | Opens cleanly in Microsoft Excel without character corruption or macro execution risks |

## Mathematical Specification & Calculation Engine

All calculations are defined in [shared/calc.ts](https://www.google.com/search?q=.%2Fshared%2Fcalc.ts) and [shared/decimal.ts](https://www.google.com/search?q=.%2Fshared%2Fdecimal.ts). No floating-point division is ever executed during intermediate calculation steps.

### Unit Scaling Conventions

| Quantity | User Input Format | Internal Integer Unit | Scaling Factor | Example |
| :--- | :--- | :--- | :--- | :--- |
| **Bag Weight** | Kilograms (`kg`), up to 3 decimal places | Grams (`g`) | $	imes 1,000$ (`dp = 3`) | `55.25 kg` $	o$ `55250` |
| **Standard Mann** | Fixed constant ($40\text{ kg}$) | Grams (`MANN_G`) | $	imes 1,000$ | $40\text{ kg} = 40,000\text{ g}$ |
| **Tare per Bag** | Kilograms (`kg`), up to 3 decimal places | Grams (`g`) | $	imes 1,000$ (`dp = 3`) | `1.0 kg` $	o$ `1000` |
| **Rate per Mann** | Rupees (`Rs.`), up to 2 decimal places | Paisa (`p`) | $	imes 100$ (`dp = 2`) | `Rs. 1,999.50` $	o$ `199950` |
| **Commission (%)** | Percentage (`%`), up to 2 decimal places | Hundredths of a percent | $	imes 100$ (`dp = 2`) | `2.50%` $	o$ `250` |
| **Fixed Charges** | Rupees (`Rs.`), up to 2 decimal places | Paisa (`p`) | $	imes 100$ (`dp = 2`) | `Rs. 10.00` $	o$ `1000` |

### Core Equations

Given $N$ bag weights $W = [w_1, w_2, \dots, w_N]$ in integer grams ($w_i > 0$), tare per bag $t_{\text{bag}} \ge 0$ in integer grams, and rate per Mann $R \ge 0$ in integer paisa:

$$\text{Gross Weight } (G_g) = \sum_{i=1}^{N} w_i$$

$$\text{Total Tare } (T_g) = t_{\text{bag}} \times N$$

$$\text{Net Weight } (N_g) = G_g - T_g \quad (\text{requires } N_g > 0)$$

$$\text{Mann Equivalent } (M_{\times 1000}) = \text{roundHalfUp}\left(\frac{N_g \times 1000}{40,000}\right)$$

$$\text{Base Amount in Paisa } (A_p) = \text{roundHalfUp}\left(\frac{N_g \times R}{40,000}\right)$$

$$\text{Commission in Paisa } (C_p) = \begin{cases} \text{roundHalfUp}\left(\dfrac{A_p \times c_{\text{bp}}}{10,000}\right) & \text{if type} = \text{'percent'} \\[8pt] c_{\text{paisa}} & \text{if type} = \text{'fixed'} \\[4pt] 0 & \text{if omitted} \end{cases}$$

$$\text{Labour in Paisa } (L_p) = \begin{cases} l_{\text{paisa}} \times N & \text{if type} = \text{'perBag'} \\[4pt] l_{\text{paisa}} & \text{if type} = \text{'fixed'} \\[4pt] 0 & \text{if omitted} \end{cases}$$

$$\text{Total in Paisa } (P_{\text{total}}) = \begin{cases} A_p + (C_p + L_p) & \text{if chargeMode} = \text{'add'} \\[4pt] A_p - (C_p + L_p) & \text{if chargeMode} = \text{'deduct'} \end{cases}$$

$$\text{Payable Rupees } (\text{Rs}_{\text{final}}) = \begin{cases} \text{roundHalfUp}\left(\dfrac{P_{\text{total}}}{100}\right) & \text{if roundToRupee} = \text{true} \\[8pt] \dfrac{P_{\text{total}}}{100} & \text{if roundToRupee} = \text{false} \end{cases}$$

where integer half-up rounding is defined for positive `BigInt` numerator $a$ and denominator $b > 0$ as:

$$\text{roundHalfUp}(a, b) = \lfloor a / b \rfloor + \begin{cases} 1 & \text{if } 2 \times (a \bmod b) \ge b \\ 0 & \text{otherwise} \end{cases}$$

&lt;details&gt;
&lt;summary&gt;&lt;strong&gt;Interactive Verification Suite: Click to Expand All 7 Official Mandi Test Vectors &amp; BigInt Stress Proof&lt;/strong&gt;&lt;/summary&gt;

<br/>

Every build of this repository is verified against the following seven canonical domain test vectors in [shared/calc.test.ts](https://www.google.com/search?q=.%2Fshared%2Fcalc.test.ts) plus randomized property-based invariants in [shared/calc.property.test.ts](https://www.google.com/search?q=.%2Fshared%2Fcalc.property.test.ts):

| Vector | Bag Weights (`kg`) | Tare / Bag | Rate / Mann | Commission | Labour | Charge Mode | Round to Rupee | Gross / Net (`kg`) | Base Amount (`Rs.`) | Final Payable (`Rs.`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vector 1** | `55, 54, 50, 58, 60` | `0 kg` | `Rs. 2,000` | None | None | `add` | `true` | `277` / `277` | `13,850.00` | **Rs. 13,850** |
| **Vector 2** | `55, 54, 50, 58, 60` | `1 kg` | `Rs. 2,000` | None | None | `add` | `true` | `277` / `272` | `13,600.00` | **Rs. 13,600** |
| **Vector 3** | `55, 54, 50, 58, 60` | `0 kg` | `Rs. 2,000` | `2%` (`Rs. 277`) | None | `add` | `true` | `277` / `277` | `13,850.00` | **Rs. 14,127** |
| **Vector 4** | `55, 54, 50, 58, 60` | `0 kg` | `Rs. 2,000` | `2%` (`Rs. 277`) | None | `deduct` | `true` | `277` / `277` | `13,850.00` | **Rs. 13,573** |
| **Vector 5** | `55, 54, 50, 58, 60` | `0 kg` | `Rs. 2,000` | None | `Rs. 10/bag` (`Rs. 50`) | `add` | `true` | `277` / `277` | `13,850.00` | **Rs. 13,900** |
| **Vector 6** | `50.5, 49.75` | `0 kg` | `Rs. 1,999.50` | None | None | `add` | `true` | `100.25` / `100.25` | `5,011.25` | **Rs. 5,011** |
| **Vector 7** | `50.5, 49.75` | `0 kg` | `Rs. 1,999.50` | None | None | `add` | `false` | `100.25` / `100.25` | `5,011.25` | **Rs. 5,011.25** |
| **BigInt Stress** | $100 \times 50,000\text{ kg}$ | `0 kg` | `Rs. 100,000` | None | None | `add` | `true` | `5,000,000` / `5,000,000` | `12,500,000,000` | **Rs. 12,500,000,000** |

**Step-by-Step Trace for Vector 6 & Vector 7 (`50.5 kg + 49.75 kg` @ `Rs. 1,999.50 / Mann`)**:
1. `parseDecimal("50.5", 3)` $	o$ `50500` g; `parseDecimal("49.75", 3)` $	o$ `49750` g.
2. `grossGBig` $= 50500 + 49750 = 100,250\text{ g}$ (`100.25 kg`).
3. `ratePaisaBig` = `parseDecimal("1999.50", 2)` $= 199,950\text{ paisa}$.
4. Intermediate product: $100,250 \times 199,950 = 20,044,987,500$.
5. Divide by `MANN_G` ($40,000$): $\text{quotient} = 501,124$, $\text{remainder} = 27,500$. Since $2 \times 27,500 = 55,000 \ge 40,000$, `roundHalfUp` increments to `501,125 paisa` (`Rs. 5,011.25`).
6. When `roundToRupee = true` (Vector 6): $\text{roundHalfUp}(501125, 100) = 5,011$ (`Rs. 5,011`).
7. When `roundToRupee = false` (Vector 7): exact decimal division yields `5011.25` (`Rs. 5,011.25`).

&lt;/details&gt;

## Thermal Receipt Studio & Customization Matrix

Receipts rendered by [SlipCard.tsx](https://www.google.com/search?q=.%2Fsrc%2Fcomponents%2FSlipCard.tsx) are engineered specifically for monochrome thermal line printers and WhatsApp image sharing. Instead of relying on greyscale antialiasing (which causes dithered blurring on thermal heads), the card uses solid `#1F2421` (`ink`) 2px/4px borders on a pure `#FFFFFF` surface with `font-variant-numeric: tabular-nums`.

### Supported Thermal Paper Profiles

| Paper Profile | Millimeter Setting | Target CSS Width | Exported PNG Resolution (`pixelRatio: 2`) | Ideal Hardware & Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Mini Portable POS** | `58 mm` | `384 px` | `768 px` wide | Handheld battery Bluetooth thermal printers (2-inch roll) |
| **Standard Desktop POS** | `80 mm` | `576 px` | `1152 px` wide | Countertop USB/LAN thermal receipt printers (3-inch roll) |
| **Full Wide Receipt** | `90 mm` | `648 px` | `1296 px` wide | High-density WhatsApp digital sharing and wide-format printers |

&lt;details&gt;
&lt;summary&gt;&lt;strong&gt;Interactive Customization Reference: Click to View All 16 Live Receipt Controls&lt;/strong&gt;&lt;/summary&gt;

<br/>

Operators can customize the receipt layout live from the **Slip View** (`Customize Slip` modal) or persist global defaults in **Settings**:

| Control Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `shopName` | `string` | `'Al-Madina Mandi Commission Shop'` | Primary bold uppercase shop banner printed at top of receipt |
| `shopSubtitle` | `string` | `'Mandi Commission Shop'` | Secondary uppercase tracking subtitle below shop title |
| `shopPhone` | `string` | `''` | Optional telephone / WhatsApp contact line (`Tel: ...`) |
| `shopAddress` | `string` | `''` | Optional shop number and mandi location line |
| `footerText` | `string` | `'Standard: 1 Mann = 40 kg • Computer Generated Slip'` | Custom bottom slogan or legal notice |
| `slipWidthMm` | `58 \| 80 \| 90` | `90` | Thermal paper width preset (`384px`, `576px`, or `648px`) |
| `compactMode` | `boolean` | `false` | Reduces vertical padding and grid gaps to conserve thermal paper rolls |
| `fontSize` | `'sm' \| 'base' \| 'lg'` | `'base'` | Scales title, body, bag grid, and total typography (`Compact`, `Standard`, `Large`) |
| `showBagsGrid` | `boolean` | `true` | Toggles the 5-column individual bag weight grid (`#1`, `#2`, ...) |
| `showParties` | `boolean` | `true` | Toggles the Seller and Buyer name rows |
| `showDate` | `boolean` | `true` | Toggles the formatted weighment timestamp (`10 Oct 2026, 1:15 PM`) |
| `showSlipCode` | `boolean` | `true` | Toggles the human-readable slip serial code (`MMDD-XXXX`) |
| `showGrossWeight` | `boolean` | `true` | Toggles the un-deducted Gross Weight summary row |
| `showTare` | `boolean` | `true` | Toggles the per-bag Tare deduction line |
| `showNetWeight` | `boolean` | `true` | Toggles the post-tare Net Weight line |
| `showMann` | `boolean` | `true` | Toggles the `1 Mann = 40 kg` conversion line (3 decimal places) |
| `showRate` | `boolean` | `true` | Toggles the applied Rate per Mann line |
| `showBaseAmount` | `boolean` | `true` | Toggles the subtotal Base Amount line prior to commission/labour |
| `showFooter` | `boolean` | `true` | Toggles the bottom footer banner |

&lt;/details&gt;

## Material Design 3 (MD3) Botanical Theme Specification

The user interface implements Google's **Material Design 3** token architecture in [src/styles/index.css](https://www.google.com/search?q=.%2Fsrc%2Fstyles%2Findex.css) and [tailwind.config.js](https://www.google.com/search?q=.%2Ftailwind.config.js) with an agricultural botanical color scheme designed for high outdoor legibility. Theme initialization runs synchronously in `<head>` within [index.html](https://www.google.com/search?q=.%2Findex.html) to prevent Flash of Unstyled Content (FOUC).

| Semantic Token | CSS Custom Property | Light Theme Hex | Dark Theme Hex | UI Role |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `--md-sys-color-primary` | `#1B6C43` | `#88D8A3` | Primary CTAs (`Add`, `Save & Show Slip`), active states, synced badges |
| **Primary Container** | `--md-sys-color-primary-container` | `#A3F5BE` | `#00522F` | Navigation rail/bar active pill indicator, synced status pill |
| **Secondary** | `--md-sys-color-secondary` | `#506352` | `#B7CCB8` | Tonal buttons, secondary chips, tare/net breakdown banner |
| **Tertiary (Wheat)** | `--md-sys-color-tertiary` | `#7C5800` | `#F6BE48` | Mann conversion highlights, active extras indicator, Total Payable label |
| **Error** | `--md-sys-color-error` | `#BA1A1A` | `#FFB4AB` | Validation alerts, two-tap reset confirmation, `VOID` and `Rejected` badges |
| **Surface** | `--md-sys-color-surface` | `#F8FAF5` | `#111412` | Primary application viewport background |
| **Surface Container High** | `--md-sys-color-surface-container-high` | `#E6E9E3` | `#272B27` | Metric cards, search bar, elevated input surfaces |
| **Thermal Ink / Cream** | `ink` / `cream` | `#1F2421` / `#F7F2E7` | `#1F2421` / `#F7F2E7` | Theme-invariant high-contrast receipt card tokens |

## Repository Structure & Module Directory

```text
mandi-calculator/
├── api/                                # Vercel Serverless Functions (Backend)
│   ├── _lib/                           # Backend shared utilities & database drivers
│   │   ├── auth.ts                     # HS256 JWT creation & verification via 'jose' (30d expiry)
│   │   ├── calc.ts                     # Server-side deterministic BigInt calculation engine
│   │   ├── csv.ts                      # CSV builder & formula injection sanitizer
│   │   ├── csv.test.ts                 # Unit tests for CSV escaping and injection defense
│   │   ├── db.ts                       # Neon serverless driver & auto-DDL 'ensureSchema()'
│   │   ├── ratelimit.ts                # IP-based login throttling (>= 5 failures / 15m -> 429)
│   │   ├── schema.ts                   # Server-side Zod validation schemas
│   │   └── types.ts                    # Serverless request/response & domain TypeScript interfaces
│   ├── auth/
│   │   └── login.ts                    # POST /api/auth/login (Timing-safe PIN auth)
│   └── slips/
│       ├── [id]/
│       │   └── void.ts                 # POST /api/slips/:id/void (Idempotent soft-void)
│       ├── export.ts                   # GET /api/slips/export (UTF-8 BOM CSV download)
│       └── index.ts                    # POST /api/slips (Batch upsert) & GET /api/slips (Search)
├── db/
│   └── schema.sql                      # Canonical PostgreSQL DDL for Neon Postgres
├── public/                             # Static PWA & OpenGraph assets
│   ├── icons/
│   │   ├── icon.svg                    # Standard PWA vector icon (192x192, 512x512)
│   │   └── icon-maskable.svg           # Maskable Android adaptive icon
│   ├── favicon.svg                     # Browser tab vector icon
│   ├── og-image.jpg                    # WhatsApp / social link preview banner (JPEG)
│   └── og-image.png                    # High-res social link preview banner (PNG)
├── shared/                             # Isomorphic domain logic shared by Client & Server
│   ├── calc.ts                         # Single source of truth Mandi BigInt calculation engine
│   ├── calc.test.ts                    # Unit test suite (7 required test vectors + edge cases)
│   ├── calc.property.test.ts           # Property-based determinism, scaling & commutativity tests
│   ├── decimal.ts                      # Exact string-to-integer parser ('parseDecimal'/'formatDecimal')
│   ├── schema.ts                       # Shared Zod validation schemas
│   └── types.ts                        # Shared TypeScript domain interfaces
├── src/                                # Frontend React 18 PWA Source
│   ├── components/
│   │   ├── md3/                        # Material Design 3 Reusable Component Library
│   │   │   ├── Md3Button.tsx           # Filled, tonal, outlined, elevated, and text buttons
│   │   │   ├── Md3Card.tsx             # Elevated, filled, and outlined surface cards
│   │   │   ├── Md3Chip.tsx             # Filter and action chips
│   │   │   ├── Md3Dialog.tsx           # Accessible modal dialogs with backdrop blur
│   │   │   ├── Md3Navigation.tsx       # Responsive Desktop Navigation Rail & Mobile Bottom Bar
│   │   │   ├── Md3SegmentedButton.tsx  # Multi-option segmented toggle control
│   │   │   ├── Md3Switch.tsx           # Accessible boolean toggle switch
│   │   │   └── Md3TextField.tsx        # Outlined text input with label, suffix, and error state
│   │   ├── BagChips.tsx                # Wrapping bag weight chips with tap-to-remove & Undo Last
│   │   ├── ExtrasPanel.tsx             # Collapsible accordion for Tare, Commission, Labour, Parties
│   │   ├── InstallPrompt.tsx           # Android native install prompt & iOS Safari guided banner
│   │   ├── SlipCard.tsx                # Thermal-ready monochrome receipt renderer (58/80/90mm)
│   │   ├── SlipCustomizeModal.tsx      # Live 3-tab receipt customization studio
│   │   ├── SyncBadge.tsx               # Live cloud sync status indicator & manual sync trigger
│   │   ├── TotalsBar.tsx               # Sticky live summary bar (Bags, Gross, Net, Mann, Payable)
│   │   ├── UpdatePrompt.tsx            # Service worker background update notification toast
│   │   └── WeightInput.tsx             # High-speed numeric input with 300ms duplicate guard
│   ├── lib/
│   │   ├── db.ts                       # IndexedDB ('idb') repository & JSON backup/restore engine
│   │   ├── settings.ts                 # LocalStorage + IndexedDB settings manager & theme applier
│   │   ├── settings.test.ts            # Unit tests for settings persistence and defaults
│   │   ├── slipImage.ts                # 'html-to-image' (2x PNG), 'jspdf' (PDF), & Web Share API
│   │   └── sync.ts                     # Bidirectional background sync worker ('SyncWorker')
│   ├── routes/
│   │   ├── History.tsx                 # Searchable slip history, status filters, retry & void UI
│   │   ├── Login.tsx                   # Private shop PIN unlock screen
│   │   ├── Settings.tsx                # Shop configuration, slip branding, backup & cloud controls
│   │   ├── SlipView.tsx                # Receipt preview stage, width switcher, Share/PNG/PDF actions
│   │   └── Weigh.tsx                   # Primary weighing workspace
│   ├── styles/
│   │   └── index.css                   # Tailwind directives & MD3 Light/Dark CSS custom variables
│   ├── App.tsx                         # Root state coordinator, auth guard & tab router
│   └── main.tsx                        # React 18 DOM entry point & Inter font imports
├── .env.example                        # Template for required environment variables
├── CHANGELOG.md                        # Version history and release notes
├── CONTRIBUTING.md                     # Developer guidelines, architecture rules & PR workflow
├── IMPLEMENTATION_PLAN.md              # Phased engineering specification
├── LICENSE                             # MIT License
├── TEST_CHECKLIST.md                   # End-to-end manual QA verification runbook
├── package.json                        # Dependencies and build/test scripts
├── tailwind.config.js                  # Tailwind CSS + MD3 token mappings
├── tsconfig.json                       # Strict TypeScript compiler configuration
├── vercel.json                         # Security headers & cache-control policies
├── vite.config.ts                      # Vite bundler + Workbox PWA service worker config
└── vitest.config.ts                    # Vitest test runner configuration
```

## Quick Start & Local Development

### 1. Prerequisites

- **Node.js**: `v18.18.0+` or `v20.x LTS` (recommended)
- **npm**: `v9.x+` or `v10.x+`
- **Database (Optional for offline UI, required for `/api` sync)**: A free [Neon Serverless Postgres](https://www.google.com/search?q=https%3A%2F%2Fneon.tech) instance

### 2. Clone & Install Dependencies

```bash
git clone https://github.com/fahad/mandi-calculator.git
cd mandi-calculator
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and set your local credentials:

```bash
cp .env.example .env
```

| Environment Variable | Required | Format / Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes (Backend) | `postgres://user:pass@ep-...neon.tech/neondb?sslmode=require` | Primary Neon Postgres connection string (also supports `POSTGRES_URL` or `STORAGE_URL` fallbacks) |
| `APP_PIN` | Yes (Backend) | Plaintext string (8+ digits/characters recommended) | Shop security PIN verified via constant-time SHA-256 hash comparison in `POST /api/auth/login` |
| `AUTH_SECRET` | Yes (Backend) | Base64 string ($\ge 32$ bytes recommended; generate via `openssl rand -base64 32`) | Cryptographic secret used by `jose` to sign and verify 30-day `HS256` session JWTs |

### 4. Run Development & Verification Commands

| Command | Script Execution | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Launches the local Vite development server with Hot Module Replacement at `http://localhost:5173` |
| `npm test` | `vitest run` | Executes the complete unit and property-based test suite (`calc`, `decimal`, `csv`, `settings`) |
| `npm run test:watch` | `vitest` | Runs Vitest in interactive watch mode during TDD development |
| `npm run lint` | `eslint . --ext ts,tsx --max-warnings 0` | Enforces strict TypeScript & React Hooks linting with zero tolerated warnings |
| `npm run build` | `tsc && vite build` | Runs full TypeScript typechecking followed by production Vite bundle and Workbox service worker generation |
| `npm run preview` | `vite preview` | Serves the compiled production PWA build locally from `dist/` |
| `npm run format` | `prettier --write .` | Formats all TypeScript, TSX, CSS, JSON, and Markdown files consistently |

## Database Architecture (Neon Postgres)

While the application automatically initializes its required tables on the first API request via `ensureSchema()` in [api/\_lib/db.ts](https://www.google.com/search?q=.%2Fapi%2F_lib%2Fdb.ts), you can also provision the database manually using [db/schema.sql](https://www.google.com/search?q=.%2Fdb%2Fschema.sql).

### Relational Schema Overview

| Table Name | Primary Key | Key Columns & Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `slips` | `id` (`text`, Client ULID) | `slip_code`, `created_at`, `bag_count > 0`, `gross_g > 0`, `net_g > 0`, `rate_paisa >= 0`, `total_paisa`, `total_rupees`, `voided_at`, `void_reason` | Stores master weighment slip headers, computed monetary totals, and soft-void audit metadata |
| `bag_weights` | `(slip_id, seq)` | `slip_id` (`REFERENCES slips(id) ON DELETE CASCADE`), `seq` (`int`), `grams` (`int > 0`) | Stores individual bag weights in exact sequential weighing order |
| `login_attempts` | `id` (`bigserial`) | `ip` (`text`), `at` (`timestamptz`), `ok` (`boolean`) | Tracks authentication attempts per IP address to enforce brute-force rate limiting |

&lt;details&gt;
&lt;summary&gt;&lt;strong&gt;Interactive SQL Schema: Click to View Full PostgreSQL DDL (db/schema.sql)&lt;/strong&gt;&lt;/summary&gt;

```sql
-- Mandi Weighment & Cost Calculator Database Schema for Neon Postgres
-- Run once in Neon SQL console or let api/_lib/db.ts auto-initialize

create table if not exists slips (
  id              text primary key,                 -- client-generated ULID (idempotency key)
  slip_code       text not null,                    -- human-readable, e.g. 1010-7K3F
  created_at      timestamptz not null,             -- device time
  received_at     timestamptz not null default now(),
  device_id       text,
  seller          text,
  buyer           text,
  receipt_name    text,
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

&lt;/details&gt;

## Serverless API Reference

All backend routes reside under `/api/*` and return structured JSON (except `/api/slips/export`, which streams `text/csv; charset=utf-8`). Every route except `/api/auth/login` requires an `Authorization: Bearer <jwt>` header.

| Method & Route | Auth Required | Rate Limit / Batch Cap | Description |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | Public | Max 5 failed attempts / 15 min per IP | Verifies shop `pin` in constant time and issues a 30-day `HS256` JWT |
| `POST /api/slips` | Bearer JWT | 1 to 50 slips per request | Recomputes slip totals server-side and performs idempotent batch upsert |
| `GET /api/slips` | Bearer JWT | `limit` up to 500 (default `200`) | Queries slips ordered by `created_at DESC` with optional `q` search filter |
| `POST /api/slips/[id]/void` | Bearer JWT | Idempotent single-slip mutation | Soft-voids a slip with `COALESCE(voided_at, now())` and audit reason |
| `GET /api/slips/export` | Bearer JWT | Full dataset stream | Exports all slips and semicolon-delimited bag weights as a sanitized UTF-8 BOM CSV |

&lt;details&gt;
&lt;summary&gt;&lt;strong&gt;Interactive API Explorer: Click to Inspect Request &amp; Response Payloads&lt;/strong&gt;&lt;/summary&gt;

### 1. Authenticate Shop PIN (`POST /api/auth/login`)

**Request**:
```bash
curl -X POST https://stock-calculus.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin": "12345678"}'
```

**Success Response (`200 OK`)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzaG9wIiwiaWF0IjoxNzYw...",
  "expiresAt": "2026-11-13T11:23:38.000Z"
}
```

**Error Responses**:
- `401 Unauthorized`: `{ "error": { "code": "invalid_pin", "message": "Invalid PIN" } }`
- `429 Too Many Requests`: `{ "error": { "code": "too_many_attempts", "message": "Too many failed login attempts. Try again in 15 minutes." } }`

### 2. Batch Upsert Weighment Slips (`POST /api/slips`)

**Request**:
```bash
curl -X POST https://stock-calculus.vercel.app/api/slips \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "slips": [
      {
        "id": "01J9X7K2M8N4P6Q8R0S2T4V6W8",
        "createdAt": "2026-10-14T11:00:00.000Z",
        "deviceId": "dev_8f9k2m1x",
        "seller": "Chaudhry Aslam",
        "buyer": "Madina Flour Mills",
        "receiptName": "Wheat Lot #4",
        "note": "Grade A Punjab Wheat",
        "weightsG": [55000, 54000, 50000, 58000, 60000],
        "ratePaisa": 200000,
        "tarePerBagG": 1000,
        "commission": { "type": "percent", "hundredthsPct": 200 },
        "labour": { "type": "perBag", "paisa": 1000 },
        "chargeMode": "add",
        "roundToRupee": true
      }
    ]
  }'
```

**Success Response (`200 OK`)**:
```json
{
  "results": [
    {
      "id": "01J9X7K2M8N4P6Q8R0S2T4V6W8",
      "status": "created"
    }
  ]
}
```

### 3. Soft-Void a Slip (`POST /api/slips/[id]/void`)

**Request**:
```bash
curl -X POST https://stock-calculus.vercel.app/api/slips/01J9X7K2M8N4P6Q8R0S2T4V6W8/void \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Incorrect scale tare calibration during weighing"}'
```

**Success Response (`200 OK`)**:
```json
{
  "ok": true
}
```

&lt;/details&gt;

## Production Deployment & Mobile PWA Installation

### Deploying to Vercel

1. Push this repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. In the [Vercel Dashboard](https://www.google.com/search?q=https%3A%2F%2Fvercel.com%2Fnew), import the repository and select the **Vite** framework preset.
3. Configure the three required Environment Variables in **Project Settings -> Environment Variables**:
   - `DATABASE_URL`
   - `APP_PIN`
   - `AUTH_SECRET`
4. Trigger **Deploy**. Vercel compiles the static PWA frontend and provisions `/api/*` serverless functions with the hardened HTTP security headers defined in [vercel.json](https://www.google.com/search?q=.%2Fvercel.json) (`X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: geolocation=(), camera=(), microphone=()`).

### Installing on Mobile Devices ("Add to Home Screen")

| Platform | Browser | Installation Procedure |
| :--- | :--- | :--- |
| **Android** | Chrome / Samsung Internet | Open the deployed URL. Tap **Install** on the top **Install Mandi App** banner (powered by `beforeinstallprompt` in [InstallPrompt.tsx](https://www.google.com/search?q=.%2Fsrc%2Fcomponents%2FInstallPrompt.tsx)) to add the standalone app to your app drawer. |
| **iOS / iPadOS** | Safari (Required on iOS) | Open the deployed URL in Safari. Tap the **Share** button in the bottom bar, scroll down and select **Add to Home Screen**, then tap **Add**. Launches full-screen with persistent IndexedDB storage. |
| **Desktop** | Chrome / Edge | Click the install icon on the right side of the address bar to run the calculator in a standalone desktop window with the MD3 Navigation Rail. |

&lt;details&gt;
&lt;summary&gt;&lt;strong&gt;Interactive Troubleshooting &amp; Operational Runbook: Click to Expand&lt;/strong&gt;&lt;/summary&gt;

<br/>

- **Issue: Login screen returns HTTP 429 ("Too many failed login attempts. Try again in 15 minutes.")**
  - **Cause**: Five or more failed PIN attempts were recorded from the same client IP within a rolling 15-minute window in `login_attempts`.
  - **Resolution**: Wait 15 minutes for the window to expire, or clear recent rows for your IP in the Neon SQL console: `DELETE FROM login_attempts WHERE ok = false;`.
- **Issue: Slips appear as "Rejected" in History**
  - **Cause**: Either the cloud database connection string was temporarily unreachable or a schema constraint failed.
  - **Resolution**: Open the **History** tab and click **Retry Sync** on the red alert banner (or open **Settings -> Sync & Retry All Slips**). This resets `syncStatus` from `'rejected'` to `'pending'` and triggers an immediate batch upload.
- **Issue: Migrating offline slips to a new phone without cloud sync**
  - **Resolution**: On the old device, navigate to **Settings -> Data Backup & Restore -> Export** to download `mandi-backup-YYYY-MM-DD.json`. Transfer the file to the new device and tap **Import**. The importer safely merges records by ULID without duplicating existing slips.

&lt;/details&gt;

## Contributing & License

We welcome contributions that strengthen calculation determinism, offline reliability, and thermal printer compatibility. Please review [CONTRIBUTING.md](https://www.google.com/search?q=.%2FCONTRIBUTING.md) for architectural invariants, testing standards, and pull request procedures before submitting changes.

Distributed under the **MIT License**. See [LICENSE](https://www.google.com/search?q=.%2FLICENSE) for full legal text.
