# Mandi Weighment & Cost Calculator

An offline-first, mobile-optimized **Progressive Web App (PWA)** built for wholesale agricultural markets (*mandis*). The app records bag weights as they are weighed, maintains a real-time running gross/net total, converts kilograms into Mann ($1\text{ Mann} = 40\text{ kg}$), computes payable amounts at the daily rate, and generates high-contrast digital and thermal-ready receipt slips that can be shared or printed.

---

## 🌟 Key Features

- **Integer-Only Precision**: Zero floating-point arithmetic. Weights are stored strictly in integer grams ($1\text{ kg} = 1,000\text{ g}$) and money amounts in integer paisa ($\text{Rs. } 1 = 100\text{ paisa}$) to eliminate floating-point rounding errors.
- **Offline-First Storage**: Slips are instantly committed to local browser IndexedDB (`idb`) with full offline availability.
- **Background Cloud Sync**: Automatic single-flight background sync to Neon Postgres via Vercel serverless functions when online.
- **Receipt Generation & Sharing**:
  - Exact thermal dot widths: **58 mm (384 px)** and **80 mm (576 px)** modes.
  - High-resolution receipt PNG generation via `html-to-image` at `pixelRatio: 2`.
  - Native Web Share API integration (shares directly to WhatsApp, SMS, or AirPrint/direct printer).
- **Flexible Market Controls**:
  - Configurable Tare deduction per bag.
  - Commission calculation (Percentage `%` or Fixed `Rs.`).
  - Labour / Mazdoori calculation (`Per Bag` or `Total Rs.`).
  - Charge mode selector: **Add to Bill** (for buyer) or **Deduct** (for seller).
  - Rounding option: Round to nearest whole rupee or show exact paisa.
  - Soft-voiding audit trail: Slips are never hard-deleted.
- **Cross-Platform PWA**: Runs on Android, iPhone/iPad, and desktop browsers with custom home-screen installation banners.

---

## 🧮 Core Formula

$$\text{Net Weight (kg)} = \text{Gross Weight (kg)} - (\text{Tare per bag (kg)} \times \text{Bag Count})$$
$$\text{Base Amount (Rs)} = \frac{\text{Net Weight (kg)} \times \text{Rate per Mann (Rs)}}{40}$$

### Worked Example (Test Vector 1):
- **Bags**: 55 kg, 54 kg, 50 kg, 58 kg, 60 kg $\to$ Gross: **277 kg**
- **Rate**: Rs. 2,000 per Mann
- **Payable Total**: $\frac{277 \times 2000}{40} =$ **Rs. 13,850**

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ or v20+ recommended
- **npm**: v9+

### 2. Installation
```bash
git clone <repo-url> mandi-calculator
cd mandi-calculator
npm install
```

### 3. Running Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Running Tests
```bash
# Run unit & property tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

---

## 🗄️ Database Setup (Neon Postgres)

1. Create a free Postgres database at [neon.tech](https://neon.tech).
2. Open the **SQL Editor** in your Neon dashboard.
3. Copy the contents of [`db/schema.sql`](file:///c:/Users/Fahad/OneDrive/Music/mandi%20calculator/db/schema.sql) and execute the query to create the required tables:
   - `slips`: Primary slip table with foreign keys, constraint checks, and audit columns.
   - `bag_weights`: Transactional weight records for each individual bag.
   - `login_attempts`: Rate-limiting table tracking IP attempts.

---

## 🔐 Environment Variables

Create a `.env` file (or set these in your **Vercel Project Settings $\to$ Environment Variables**):

```ini
# Neon Postgres connection string (with SSL required)
DATABASE_URL=postgres://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Shop security PIN (at least 8 characters recommended)
APP_PIN=12345678

# Cryptographic secret for signing JWTs (minimum 32 bytes base64)
# Generate with: openssl rand -base64 32
AUTH_SECRET=dGhpcy1pcy1hLXNhbXBsZS1hdXRoLXNlY3JldC1mb3ItZGV2LTEyMzQ1Njc4OTA=
```

---

## ☁️ Deployment Guide (Vercel)

This application is designed for zero-config deployment on **Vercel**:

1. Push your repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New $\to$ Project** and import the repository.
3. Set the Framework Preset to **Vite**.
4. In **Environment Variables**, add:
   - `DATABASE_URL`
   - `APP_PIN`
   - `AUTH_SECRET`
5. Click **Deploy**. Both the Vite PWA frontend and the `/api` serverless endpoints will be deployed automatically.

---

## 📱 Mobile Installation ("Add to Home Screen")

### On Android (Chrome / Samsung Internet):
1. Visit the deployed app URL in Chrome or Samsung Internet.
2. An **"Install Mandi App"** banner will automatically appear at the top.
3. Tap **Install** to add the standalone app to your home screen and app drawer.

### On iPhone (Safari):
1. Open the website in **Safari** (Safari is required on iOS for home-screen PWA features).
2. Tap the **Share** button (box with an upward arrow) in the browser bottom bar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top-right corner. The app will now launch full-screen without browser address bars and will have persistent storage protection.
