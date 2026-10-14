# Contributing to Mandi Weighment & Cost Calculator

Thank you for your interest in contributing to **Mandi Weighment & Cost Calculator** (`STOCK_CALCULUS_404`). This project is relied upon in wholesale agricultural markets (*mandis*) to calculate physical commodity weighments and financial settlements. Consequently, mathematical accuracy, offline durability, and thermal receipt legibility are non-negotiable engineering priorities.

Please read and follow these guidelines carefully before opening an issue or submitting a pull request.

## Core Engineering Invariants

Every contribution must preserve the following four architectural invariants:

### 1. Strict Integer-Only Arithmetic (Zero Floating-Point Math)
- **Never** use IEEE-754 floating-point arithmetic (`parseFloat`, unscaled `Number()`, or standard floating-point division) to compute weights, Mann conversions, rates, commissions, labour charges, or totals.
- All bag and tare weights must be represented as integer **grams** ($1\text{ kg} = 1,000\text{ g}$).
- All rates, base amounts, commissions (when fixed), labour charges, and totals must be represented as integer **paisa** ($\text{Rs. } 1 = 100\text{ paisa}$).
- Percentage commissions must be represented as integer **hundredths of a percent** ($2.50\% = 250$).
- All intermediate multiplications and half-up divisions must use `BigInt` via `roundHalfUp(numerator: bigint, denominator: bigint)` in [shared/calc.ts](https://www.google.com/search?q=.%2Fshared%2Fcalc.ts) to prevent overflow beyond `Number.MAX_SAFE_INTEGER` ($2^{53} - 1$).
- String inputs from UI text fields must be parsed exclusively with `parseDecimal(str, dp)` and formatted with `formatDecimal(val, dp, trimZeros)` from [shared/decimal.ts](https://www.google.com/search?q=.%2Fshared%2Fdecimal.ts).

### 2. Isomorphic Single Source of Truth
- The calculation logic in [shared/calc.ts](https://www.google.com/search?q=.%2Fshared%2Fcalc.ts) and [api/\_lib/calc.ts](https://www.google.com/search?q=.%2Fapi%2F_lib%2Fcalc.ts), along with the Zod schemas in [shared/schema.ts](https://www.google.com/search?q=.%2Fshared%2Fschema.ts) and [api/\_lib/schema.ts](https://www.google.com/search?q=.%2Fapi%2F_lib%2Fschema.ts), must remain 100% synchronized.
- When `POST /api/slips` receives a batch of slips from a client, the server **must** recompute all derived totals (`bagCount`, `grossG`, `netG`, `amountPaisa`, `commissionPaisa`, `labourPaisa`, `totalPaisa`, `totalRupees`) from the raw `weightsG` and `ratePaisa` inputs rather than trusting client-computed totals.

### 3. Offline-First Persistence & Non-Destructive Auditing
- Any user action that creates or modifies a weighment slip must commit to local `IndexedDB` (`src/lib/db.ts`) **before** navigating or triggering network calls.
- Financial records are **never hard-deleted**. Cancellation is handled exclusively through idempotent soft-voiding (`voidSlipRecord` locally and `POST /api/slips/[id]/void` on the server), which records `voided_at` and a mandatory `void_reason` ($\ge 3$ characters).

### 4. High-Contrast Thermal Receipt Integrity
- Changes to [src/components/SlipCard.tsx](https://www.google.com/search?q=.%2Fsrc%2Fcomponents%2FSlipCard.tsx) must preserve crisp monochrome contrast (`#1F2421` ink on `#FFFFFF` white) and `tabular-nums` alignment across all three supported thermal paper widths:
  - `58 mm` (`384 px` CSS width / `768 px` PNG width at `pixelRatio: 2`)
  - `80 mm` (`576 px` CSS width / `1152 px` PNG width at `pixelRatio: 2`)
  - `90 mm` (`648 px` CSS width / `1296 px` PNG width at `pixelRatio: 2`)

## Development Environment Setup

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/mandi-calculator.git
cd mandi-calculator
npm install
```

### 2. Local Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```ini
DATABASE_URL=postgres://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
APP_PIN=12345678
AUTH_SECRET=dGhpcy1pcy1hLXNhbXBsZS1hdXRoLXNlY3JldC1mb3ItZGV2LTEyMzQ1Njc4OTA=
```

> [!NOTE]
> You can develop and test the entire Weighing UI, Receipt Customization Studio, IndexedDB persistence, and Vitest test suite completely offline without an active `DATABASE_URL`.

### 3. Verification Toolchain

Before submitting any pull request, run the full verification pipeline locally:

```bash
# 1. Run unit and property-based tests
npm test

# 2. Run ESLint (zero warnings allowed)
npm run lint

# 3. Verify TypeScript strict compilation and production Vite build
npm run build

# 4. Enforce Prettier code formatting
npm run format
```

## Testing Standards

All changes to calculation logic, decimal parsing, settings management, or CSV export must include automated tests in Vitest:

| Test Suite | File Location | Coverage Scope |
| :--- | :--- | :--- |
| **Core Calculation & Decimal Unit Tests** | [shared/calc.test.ts](https://www.google.com/search?q=.%2Fshared%2Fcalc.test.ts) | All 7 mandatory Mandi test vectors, `parseDecimal`/`formatDecimal` edge cases, zero-bag/negative-net guards, and `BigInt` 5,000-ton stress test |
| **Property-Based Invariant Tests** | [shared/calc.property.test.ts](https://www.google.com/search?q=.%2Fshared%2Fcalc.property.test.ts) | Determinism, bag-order commutativity ($\sum w_i$ invariant under permutation), tare linearity, and charge-mode symmetry (`add` vs `deduct`) |
| **CSV Sanitization Tests** | [api/\_lib/csv.test.ts](https://www.google.com/search?q=.%2Fapi%2F_lib%2Fcsv.test.ts) | Quote escaping, delimiter handling, and spreadsheet formula-injection neutralization (`=`, `+`, `-`, `@`) |
| **Settings & Theme Persistence Tests** | [src/lib/settings.test.ts](https://www.google.com/search?q=.%2Fsrc%2Flib%2Fsettings.test.ts) | Default fallback hydration, slip customization merging, and `data-theme` attribute application |

In addition to automated tests, UI and workflow changes should be verified against the manual scenarios in [TEST\_CHECKLIST.md](https://www.google.com/search?q=.%2FTEST_CHECKLIST.md).

## Code Style & TypeScript Conventions

- **Strict TypeScript**: `tsconfig.json` enforces `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, and `"noFallthroughCasesInSwitch": true`. Avoid `any`; use explicit interfaces from `shared/types.ts` or Zod type inference (`z.infer<typeof schema>`).
- **Formatting**: Managed by Prettier (`.prettierrc`):
  - Single quotes (`"singleQuote": true`)
  - Semicolons required (`"semi": true`)
  - Print width `100` characters (`"printWidth": 100`)
  - ES5 trailing commas (`"trailingComma": "es5"`)
- **UI Components**: Use the Material Design 3 (`md3`) primitives in `src/components/md3/` (`Md3Button`, `Md3Card`, `Md3Chip`, `Md3Dialog`, `Md3Navigation`, `Md3SegmentedButton`, `Md3Switch`, `Md3TextField`) and semantic MD3 color classes (`bg-md-surface`, `text-md-on-surface`, `bg-md-primary`, etc.) so both Light and Dark themes remain consistent.

## Commit Message Guidelines

Follow the **Conventional Commits** specification so changelogs and history remain clear:

| Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feat:` | A new user-facing or API capability | `feat(slip): add 90mm wide thermal receipt mode and PDF export` |
| `fix:` | A bug fix in calculation, sync, or UI | `fix(sync): reset rejected slip status before manual batch retry` |
| `perf:` | Performance or rendering improvement | `perf(weigh): memoize live CalcResult computation on bag entry` |
| `test:` | Adding or updating Vitest unit/property tests | `test(calc): add BigInt overflow test beyond MAX_SAFE_INTEGER` |
| `docs:` | Documentation, README, or comment updates | `docs(readme): add architecture diagrams and API payload examples` |
| `refactor:` | Code restructuring without behavior change | `refactor(db): extract IndexedDB slip repository helpers` |
| `chore:` | Build scripts, dependencies, or config updates | `chore(deps): update vite-plugin-pwa and workbox configuration` |

## Pull Request Process

1. **Create a Feature Branch**: Branch off `main` using a descriptive name (`git checkout -b feat/short-description` or `fix/issue-summary`).
2. **Keep Changes Focused**: Submit one logical feature or bug fix per pull request.
3. **Sync Isomorphic Files**: If you modify `shared/calc.ts`, `shared/types.ts`, or `shared/schema.ts`, ensure the corresponding module in `api/_lib/` is updated in lockstep.
4. **Verify All Checks Pass**: Confirm `npm test`, `npm run lint`, and `npm run build` exit with code `0`.
5. **Document User-Visible Changes**: Update `CHANGELOG.md` and `README.md` if you introduce new settings, endpoints, or calculation options.

&lt;details&gt;
&lt;summary&gt;&lt;strong&gt;Pull Request Checklist (Copy into your PR Description)&lt;/strong&gt;&lt;/summary&gt;

```markdown
### Summary of Changes
- Describe the problem solved or feature added.

### Verification Checklist
- [ ] Zero floating-point math introduced in weight or currency calculations.
- [ ] `shared/*` and `api/_lib/*` modules remain synchronized (if applicable).
- [ ] `npm test` passes all unit and property-based test suites.
- [ ] `npm run lint` passes with 0 warnings.
- [ ] `npm run build` succeeds without TypeScript or bundler errors.
- [ ] Receipt rendering verified across 58 mm, 80 mm, and 90 mm widths (if UI changed).
- [ ] Light and Dark MD3 themes verified (if UI changed).
```

&lt;/details&gt;

## Reporting Bugs & Security Issues

- **Calculation or Sync Bugs**: When reporting a bug, include the exact bag weights array, rate per Mann, tare/commission/labour settings, browser/OS version, and whether the device was online or offline.
- **Security Vulnerabilities**: Never commit real `.env` files, `DATABASE_URL` credentials, `APP_PIN` values, or `AUTH_SECRET` keys to git history. If you discover a security vulnerability in PIN authentication or API rate limiting, please report it privately to the repository maintainers before disclosing it publicly.
