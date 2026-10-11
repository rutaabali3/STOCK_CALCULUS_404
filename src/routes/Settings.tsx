import React, { useState } from 'react';
import { AppSettings, ThemeMode, SlipFontSize, DEFAULT_SLIP_CUSTOMIZATION } from '../lib/settings';
import { exportBackupData, importBackupData, BackupData, getOrCreateDeviceId } from '../lib/db';
import { formatDecimal, parseDecimal } from 'shared/decimal';
import { Download, Upload, ArrowLeft, Check, ShieldCheck, Sun, Moon, Monitor, SlidersHorizontal, LogOut, Cloud, RefreshCw } from 'lucide-react';
import { Md3Button } from '../components/md3/Md3Button';
import { Md3Card } from '../components/md3/Md3Card';
import { Md3TextField } from '../components/md3/Md3TextField';
import { Md3SegmentedButton } from '../components/md3/Md3SegmentedButton';
import { Md3Switch } from '../components/md3/Md3Switch';
import { syncWorker } from '../lib/sync';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onBack: () => void;
  onLogout?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  onLogout,
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [rateStr, setRateStr] = useState(() => formatDecimal(settings.defaultRatePaisa, 2));
  const [tareStr, setTareStr] = useState(() =>
    settings.defaultTareG > 0 ? formatDecimal(settings.defaultTareG, 3) : ''
  );
  const [chargeMode, setChargeMode] = useState(settings.chargeMode);
  const [roundToRupee, setRoundToRupee] = useState(settings.roundToRupee);
  const [slipWidthMm, setSlipWidthMm] = useState<58 | 80 | 90>(settings.slipWidthMm);
  const [theme, setTheme] = useState<ThemeMode>(settings.theme || 'system');

  // Slip Customization State
  const initialCustom = settings.slipCustomization || DEFAULT_SLIP_CUSTOMIZATION;
  const [shopSubtitle, setShopSubtitle] = useState(initialCustom.shopSubtitle ?? settings.shopSubtitle ?? 'Mandi Commission Shop');
  const [shopPhone, setShopPhone] = useState(initialCustom.shopPhone ?? settings.shopPhone ?? '');
  const [shopAddress, setShopAddress] = useState(initialCustom.shopAddress ?? settings.shopAddress ?? '');
  const [footerText, setFooterText] = useState(initialCustom.footerText ?? settings.footerText ?? 'Standard: 1 Mann = 40 kg • Computer Generated Slip');
  const [showBagsGrid, setShowBagsGrid] = useState(initialCustom.showBagsGrid !== false);
  const [showParties, setShowParties] = useState(initialCustom.showParties !== false);
  const [showDate, setShowDate] = useState(initialCustom.showDate !== false);
  const [showSlipCode, setShowSlipCode] = useState(initialCustom.showSlipCode !== false);
  const [showMann, setShowMann] = useState(initialCustom.showMann !== false);
  const [showTare, setShowTare] = useState(initialCustom.showTare !== false);
  const [showGrossWeight, setShowGrossWeight] = useState(initialCustom.showGrossWeight !== false);
  const [showRate, setShowRate] = useState(initialCustom.showRate !== false);
  const [showBaseAmount, setShowBaseAmount] = useState(initialCustom.showBaseAmount !== false);
  const [showFooter, setShowFooter] = useState(initialCustom.showFooter !== false);
  const [compactMode, setCompactMode] = useState(Boolean(initialCustom.compactMode));
  const [fontSize, setFontSize] = useState<SlipFontSize>(initialCustom.fontSize || 'base');

  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const deviceId = getOrCreateDeviceId();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    const defaultRatePaisa = parseDecimal(rateStr, 2) ?? settings.defaultRatePaisa;
    const defaultTareG = tareStr.trim() ? (parseDecimal(tareStr, 3) ?? 0) : 0;

    const updated: AppSettings = {
      shopName: shopName.trim() || 'Mandi Commission Shop',
      shopSubtitle: shopSubtitle.trim(),
      shopPhone: shopPhone.trim(),
      shopAddress: shopAddress.trim(),
      footerText: footerText.trim(),
      defaultRatePaisa,
      defaultTareG,
      chargeMode,
      roundToRupee,
      slipWidthMm,
      theme,
      slipCustomization: {
        shopSubtitle: shopSubtitle.trim(),
        shopPhone: shopPhone.trim(),
        shopAddress: shopAddress.trim(),
        footerText: footerText.trim(),
        showBagsGrid,
        showParties,
        showDate,
        showSlipCode,
        showMann,
        showTare,
        showGrossWeight,
        showRate,
        showBaseAmount,
        showFooter,
        compactMode,
        fontSize,
      },
    };

    onUpdateSettings(updated);
    showToast('Settings saved successfully');
  };

  const handleExportBackup = async () => {
    try {
      const data = await exportBackupData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mandi-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Backup file exported');
    } catch {
      showToast('Failed to export backup');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: BackupData = JSON.parse(text);
      const res = await importBackupData(parsed);
      onUpdateSettings(parsed.settings || settings);
      showToast(`Imported ${res.imported} slips (${res.skipped} already existed)`);
    } catch {
      showToast('Invalid backup file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Bar Header */}
      <header className="flex items-center justify-between pb-4 border-b border-md-outline-variant/20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-on-surface/[0.08] transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black text-md-on-surface tracking-tight">
            Settings
          </h1>
        </div>

        <Md3Button
          variant="filled"
          size="sm"
          onClick={handleSave}
          icon={<Check className="w-4 h-4" />}
        >
          Save Changes
        </Md3Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Shop & Calculations */}
        <Md3Card variant="elevated" className="p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-md-primary">
            Shop Information & Rates
          </h2>

          <Md3TextField
            label="Shop Title (Printed on Slip)"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Md3TextField
              label="Default Rate (Rs)"
              inputMode="decimal"
              value={rateStr}
              onChange={(e) => setRateStr(e.target.value)}
            />
            <Md3TextField
              label="Default Tare (kg)"
              inputMode="decimal"
              placeholder="0"
              value={tareStr}
              onChange={(e) => setTareStr(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-md-outline-variant/20">
            <div>
              <span className="block text-sm font-bold text-md-on-surface">
                Round Total to Rupee
              </span>
              <span className="text-xs text-md-on-surface-variant">
                Rounds final bill to whole rupee
              </span>
            </div>
            <Md3Switch
              checked={roundToRupee}
              onChange={setRoundToRupee}
              ariaLabel="Round total to rupee"
            />
          </div>
        </Md3Card>

        {/* Card 2: Calculation & Slip Modes */}
        <Md3Card variant="elevated" className="p-5 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-md-primary">
            Billing & Print Dimensions
          </h2>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-md-on-surface-variant">
              Commission & Mazdoori Mode
            </label>
            <Md3SegmentedButton<'add' | 'deduct'>
              value={chargeMode}
              onChange={setChargeMode}
              className="w-full justify-center"
              options={[
                { value: 'add', label: 'Add to Bill (Buyer)' },
                { value: 'deduct', label: 'Deduct (Seller)' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-md-on-surface-variant">
              Thermal Print Slip Width
            </label>
            <Md3SegmentedButton<58 | 80 | 90>
              value={slipWidthMm}
              onChange={setSlipWidthMm}
              className="w-full justify-center"
              options={[
                { value: 58, label: '58 mm' },
                { value: 80, label: '80 mm' },
                { value: 90, label: '90 mm' },
              ]}
            />
          </div>

          {/* Theme Mode Selector */}
          <div className="space-y-2 pt-2 border-t border-md-outline-variant/20">
            <label className="block text-xs font-bold uppercase tracking-wider text-md-on-surface-variant">
              Theme / Appearance
            </label>
            <Md3SegmentedButton<ThemeMode>
              value={theme}
              onChange={(newTheme) => {
                setTheme(newTheme);
                // Also trigger live preview
                if (typeof window !== 'undefined') {
                  const isDark =
                    newTheme === 'dark' ||
                    (newTheme === 'system' &&
                      window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.removeAttribute('data-theme');
                  }
                }
              }}
              className="w-full justify-center"
              options={[
                { value: 'system', label: 'System', icon: <Monitor className="w-3.5 h-3.5" /> },
                { value: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
                { value: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
              ]}
            />
          </div>
        </Md3Card>

        {/* Card 3: Slip Customization & Branding */}
        <Md3Card variant="elevated" className="p-5 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-md-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-md-primary">
              Slip Customization & Branding
            </h2>
          </div>
          <p className="text-xs text-md-on-surface-variant leading-relaxed">
            Configure contact details printed on the slip, toggle sections to display, and set thermal print options.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Md3TextField
              label="Shop Tagline / Subtitle"
              value={shopSubtitle}
              onChange={(e) => setShopSubtitle(e.target.value)}
              placeholder="e.g. Mandi Commission Shop"
            />
            <Md3TextField
              label="Phone / WhatsApp Contact"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              placeholder="e.g. 0300-1234567"
            />
            <Md3TextField
              label="Shop Address / Market Location"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              placeholder="e.g. Shop #12, Ghalla Mandi"
            />
          </div>

          <Md3TextField
            label="Custom Footer Slogan / Notice"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="e.g. Standard: 1 Mann = 40 kg • Computer Generated Slip"
          />

          <div className="pt-2 border-t border-md-outline-variant/20 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-md-on-surface-variant">
              Section Visibility & Print Layout
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
                <div>
                  <span className="block text-xs font-bold text-md-on-surface">Bag Weights Grid</span>
                  <span className="text-[10px] text-md-on-surface-variant">Individual bag weight chips</span>
                </div>
                <Md3Switch checked={showBagsGrid} onChange={setShowBagsGrid} ariaLabel="Show bag weights grid" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
                <div>
                  <span className="block text-xs font-bold text-md-on-surface">Seller & Buyer</span>
                  <span className="text-[10px] text-md-on-surface-variant">Party names when provided</span>
                </div>
                <Md3Switch checked={showParties} onChange={setShowParties} ariaLabel="Show parties" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
                <div>
                  <span className="block text-xs font-bold text-md-on-surface">Mann Equivalent</span>
                  <span className="text-[10px] text-md-on-surface-variant">1 Mann = 40 kg conversion</span>
                </div>
                <Md3Switch checked={showMann} onChange={setShowMann} ariaLabel="Show Mann line" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
                <div>
                  <span className="block text-xs font-bold text-md-on-surface">Tare Breakdown</span>
                  <span className="text-[10px] text-md-on-surface-variant">Tare deduction & Net weight</span>
                </div>
                <Md3Switch checked={showTare} onChange={setShowTare} ariaLabel="Show tare breakdown" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
                <div>
                  <span className="block text-xs font-bold text-md-on-surface">Date & Slip Code</span>
                  <span className="text-[10px] text-md-on-surface-variant">Timestamp & unique ID</span>
                </div>
                <Md3Switch checked={showDate && showSlipCode} onChange={(val) => { setShowDate(val); setShowSlipCode(val); }} ariaLabel="Show date and slip code" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
                <div>
                  <span className="block text-xs font-bold text-md-on-surface">Gross Weight</span>
                  <span className="text-[10px] text-md-on-surface-variant">Total weight before tare</span>
                </div>
                <Md3Switch checked={showGrossWeight} onChange={setShowGrossWeight} ariaLabel="Show gross weight" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
                <div>
                  <span className="block text-xs font-bold text-md-on-surface">Rate & Base Amount</span>
                  <span className="text-[10px] text-md-on-surface-variant">Rate/Mann & subtotal</span>
                </div>
                <Md3Switch checked={showRate && showBaseAmount} onChange={(val) => { setShowRate(val); setShowBaseAmount(val); }} ariaLabel="Show rate and base amount" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
                <div>
                  <span className="block text-xs font-bold text-md-on-surface">Footer Banner</span>
                  <span className="text-[10px] text-md-on-surface-variant">Standard notice & slogan</span>
                </div>
                <Md3Switch checked={showFooter} onChange={setShowFooter} ariaLabel="Show footer" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
                <div>
                  <span className="block text-xs font-bold text-md-on-surface">Compact Paper-Saving</span>
                  <span className="text-[10px] text-md-on-surface-variant">Tighter thermal spacing</span>
                </div>
                <Md3Switch checked={compactMode} onChange={setCompactMode} ariaLabel="Compact mode" />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-md-on-surface-variant mb-1.5">
                Print Font Scaling
              </label>
              <Md3SegmentedButton<SlipFontSize>
                value={fontSize}
                onChange={setFontSize}
                className="w-full sm:w-auto"
                options={[
                  { value: 'sm', label: 'Compact / Small' },
                  { value: 'base', label: 'Standard' },
                  { value: 'lg', label: 'Large / High Contrast' },
                ]}
              />
            </div>
          </div>
        </Md3Card>

        {/* Card 4: Data Backup & Restore */}
        <Md3Card variant="elevated" className="p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-md-primary">
            Data Backup & Restore
          </h2>
          <p className="text-xs text-md-on-surface-variant leading-relaxed">
            Export a full JSON backup of all offline weighing records, or restore from a previous backup file.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Md3Button
              variant="tonal"
              size="md"
              onClick={handleExportBackup}
              icon={<Download className="w-4 h-4 text-md-tertiary" />}
              className="w-full"
            >
              Export
            </Md3Button>

            <Md3Button
              variant="tonal"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="w-4 h-4 text-md-primary" />}
              className="w-full"
            >
              Import
            </Md3Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </Md3Card>

        {/* Card 5: Device & System Info */}
        <Md3Card variant="elevated" className="p-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-md-primary">
            Device & Local Storage
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-md-outline-variant/15 text-md-on-surface-variant">
              <span>Device Identifier:</span>
              <span className="font-mono text-[11px] font-bold text-md-on-surface">
                {deviceId}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 text-md-on-surface-variant">
              <span>Local Storage Engine:</span>
              <span className="flex items-center gap-1.5 text-md-primary font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Persistent IndexedDB</span>
              </span>
            </div>
          </div>
        </Md3Card>

        {/* Card 6: Cloud Database Sync */}
        <Md3Card variant="elevated" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-md-primary">
              Cloud Database Sync
            </h2>
            <span className="flex items-center gap-1.5 text-xs font-bold text-md-primary">
              <Cloud className="w-4 h-4" />
              <span>Neon Postgres</span>
            </span>
          </div>
          <p className="text-xs text-md-on-surface-variant leading-relaxed">
            All weighment slips are automatically synced to your cloud database. Click below to trigger a sync or retry any rejected slips.
          </p>
          <div className="pt-2">
            <Md3Button
              variant="tonal"
              size="md"
              onClick={async () => {
                const count = await syncWorker.retryAllRejected();
                await syncWorker.triggerSync();
                showToast(count > 0 ? `Retrying sync for ${count} rejected slips...` : 'Cloud sync initiated');
              }}
              icon={<RefreshCw className="w-4 h-4 text-md-primary" />}
              className="w-full"
            >
              Sync & Retry All Slips
            </Md3Button>
          </div>
        </Md3Card>

        {/* Card 7: Security & Session */}
        <Md3Card variant="elevated" className="p-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-md-primary">
            Security & Access Lock
          </h2>
          <p className="text-xs text-md-on-surface-variant leading-relaxed">
            Your device is authorized with your shop PIN. To prevent unauthorized use, you can lock the application at any time.
          </p>
          {onLogout && (
            <div className="pt-2">
              <Md3Button
                variant="outlined"
                size="md"
                onClick={onLogout}
                icon={<LogOut className="w-4 h-4 text-md-error" />}
                className="w-full text-md-error border-md-error/40 hover:bg-md-error/10"
              >
                Lock App / Log Out
              </Md3Button>
            </div>
          )}
        </Md3Card>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-8 right-4 left-4 md:left-auto md:w-96 bg-md-inverse-surface text-md-inverse-on-surface px-5 py-3 rounded-2xl shadow-md-3 flex items-center justify-center gap-2 z-50 text-sm font-semibold animate-fade-in border border-white/10">
          <Check className="w-4 h-4 text-md-inverse-primary" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
