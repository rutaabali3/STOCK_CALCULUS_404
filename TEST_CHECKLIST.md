# Mandi Weighment & Cost Calculator — Manual Test Checklist

Use this checklist to perform final verification of all features before production launch.

---

## 1. Calculation & Weighing Tests

- [ ] **Basic Bag Entry**:
  - Enter weights `55`, `54`, `50`, `58`, `60` using the numeric keypad and `Enter` / `Add`.
  - Confirm **Gross Weight** displays exactly `277 kg`.
  - Set Rate to `2000`.
  - Confirm **Mann** displays `6.925` ($277 \div 40$).
  - Confirm **Total Payable** displays `Rs. 13,850`.

- [ ] **Chip Removal & Undo**:
  - Tap on any chip (e.g. bag #3). Confirm it is removed and totals update immediately.
  - An undo toast should appear for 5 seconds. Tap **Undo** and verify the chip is restored in its original position.
  - Tap **Undo Last** button; verify the most recently removed chip is restored.

- [ ] **Tare Deduction Test**:
  - Expand **Additional Details & Extras**.
  - Enter Tare per bag: `1` kg.
  - Confirm **Gross** remains `277 kg`, **Tare** shows `5 kg` ($1 \text{ kg} \times 5 \text{ bags}$), and **Net Weight** reads `272 kg`.
  - Confirm **Total Payable** updates to `Rs. 13,600`.

- [ ] **Commission & Labour Tests**:
  - Test Commission: Set to `2%`. Confirm with charge mode `Add` that total becomes `Rs. 14,127`.
  - Change charge mode in Settings to `Deduct`. Confirm total becomes `Rs. 13,573`.
  - Test Labour: Set to `Rs. 10` per bag. Confirm total reflects Rs. 50 labour adjustment.

- [ ] **Two-Tap Reset**:
  - Tap **Reset**. Verify button changes to "Tap to Confirm".
  - Tap again within 3 seconds $\to$ confirm all bags and inputs clear.

---

## 2. Receipt Slip & Sharing Tests

- [ ] **Slip Rendering**:
  - Add bags, set a rate, and tap **Save & Show Slip**.
  - Confirm Slip displays Shop Title, Slip Code (`MMDD-XXXX`), Date, 5-per-row bag weights grid, Gross/Net, and Total Payable.
- [ ] **Width Toggle**:
  - Toggle between `58 mm` and `80 mm`. Confirm the receipt resizes accordingly.
- [ ] **Image Sharing**:
  - On a mobile device, tap **Share Slip**. Confirm native share sheet opens (WhatsApp, Messages, etc.).
- [ ] **Image Download**:
  - Tap **Save Image**. Confirm a clean PNG named `mandi-slip-XXXX.png` downloads with sharp borders and legible text.

---

## 3. Offline & Persistence Tests

- [ ] **Offline Resilience**:
  - Turn off Wi-Fi and mobile data (or toggle Offline mode in DevTools Network tab).
  - Add bags and save a slip.
  - Confirm the slip saves cleanly to IndexedDB and opens in SlipView.
  - Go to **History** tab. Confirm the new slip appears with a `Pending` status badge.
- [ ] **Data Survival on Refresh**:
  - Refresh the browser or close and reopen the browser app.
  - Check the **History** tab $\to$ confirm all past slips remain intact.
- [ ] **JSON Backup & Restore**:
  - Open **Settings** $\to$ tap **Export Backup**.
  - Verify a valid JSON file downloads containing all slips and preferences.
  - Open DevTools $\to$ Application $\to$ IndexedDB $\to$ delete database.
  - In Settings, tap **Import Backup** and select the exported JSON file.
  - Verify all historical slips are restored without duplicate errors.

---

## 4. History & Void Flow

- [ ] **Live Search**:
  - In the **History** search bar, type a seller name or slip code suffix.
  - Confirm the list filters dynamically.
- [ ] **Soft-Void Audit**:
  - Tap **Void** on a slip row.
  - Enter a reason (e.g., "Cancelled by buyer").
  - Confirm the slip displays a red `VOID` badge, strikethrough total, and retains the recorded reason.
  - Confirm the slip is not deleted from the database.

---

## 5. Security & PWA Features

- [ ] **PWA Install Banner**:
  - On Android Chrome, verify the native "Install Mandi App" banner appears.
  - On iOS Safari, verify the guide banner ("Tap Share then Add to Home Screen") appears.
- [ ] **Security PIN & Throttling**:
  - Tap the Sync badge $\to$ open the Unlock PIN screen.
  - Enter an incorrect PIN 5 times in a row.
  - Confirm the server returns HTTP 429 ("Too many failed login attempts. Try again in 15 minutes.").
- [ ] **No Client Secrets**:
  - Inspect production build bundles in `dist/assets/`.
  - Confirm neither `APP_PIN`, `AUTH_SECRET`, nor `DATABASE_URL` are present in client code.
