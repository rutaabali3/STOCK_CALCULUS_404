import React, { useState } from 'react';
import { AppSettings } from '../lib/settings';
import { exportBackupData, importBackupData, BackupData, getOrCreateDeviceId } from '../lib/db';
import { formatDecimal, parseDecimal } from 'shared/decimal';
import { Download, Upload, ArrowLeft, Check, ShieldCheck } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [rateStr, setRateStr] = useState(() => formatDecimal(settings.defaultRatePaisa, 2));
  const [tareStr, setTareStr] = useState(() =>
    settings.defaultTareG > 0 ? formatDecimal(settings.defaultTareG, 3) : ''
  );
  const [chargeMode, setChargeMode] = useState(settings.chargeMode);
  const [roundToRupee, setRoundToRupee] = useState(settings.roundToRupee);
  const [slipWidthMm, setSlipWidthMm] = useState<58 | 80 | 90>(settings.slipWidthMm);

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
      defaultRatePaisa,
      defaultTareG,
      chargeMode,
      roundToRupee,
      slipWidthMm,
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
    <div className="w-full max-w-md mx-auto min-h-screen p-4 pb-12 flex flex-col justify-between space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-moss/20">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="p-1 text-mist hover:text-forest transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black text-forest">Settings</h1>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-forest text-white rounded-lg text-xs font-bold shadow-sm hover:bg-forest/90"
          >
            Save
          </button>
        </div>

        {/* Shop Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-mist uppercase tracking-wider">
            Shop Title (Printed on Slip)
          </label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full h-12 px-3 text-sm bg-white border border-moss/30 rounded-xl focus:border-forest focus:outline-none font-semibold text-ink"
          />
        </div>

        {/* Default Rate & Tare */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-mist uppercase tracking-wider">
              Default Rate (Rs)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={rateStr}
              onChange={(e) => setRateStr(e.target.value)}
              className="w-full h-12 px-3 text-sm bg-white border border-moss/30 rounded-xl focus:border-forest focus:outline-none tabular-nums font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mist uppercase tracking-wider">
              Default Tare (kg)
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={tareStr}
              onChange={(e) => setTareStr(e.target.value)}
              className="w-full h-12 px-3 text-sm bg-white border border-moss/30 rounded-xl focus:border-forest focus:outline-none tabular-nums font-semibold"
            />
          </div>
        </div>

        {/* Charge Mode */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-mist uppercase tracking-wider">
            Commission & Labour Calculation
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setChargeMode('add')}
              className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                chargeMode === 'add'
                  ? 'bg-forest text-white border-forest'
                  : 'bg-white text-mist border-moss/20 hover:border-moss'
              }`}
            >
              Add to Bill (Buyer)
            </button>
            <button
              type="button"
              onClick={() => setChargeMode('deduct')}
              className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                chargeMode === 'deduct'
                  ? 'bg-forest text-white border-forest'
                  : 'bg-white text-mist border-moss/20 hover:border-moss'
              }`}
            >
              Deduct (Seller)
            </button>
          </div>
        </div>

        {/* Rounding & Slip Width */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-moss/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-sm font-bold text-forest">Round Total to Rupee</span>
              <span className="text-xs text-mist">Rounds final payment to nearest whole rupee</span>
            </div>
            <input
              type="checkbox"
              checked={roundToRupee}
              onChange={(e) => setRoundToRupee(e.target.checked)}
              className="w-5 h-5 accent-forest rounded"
            />
          </div>

          <div className="border-t border-moss/10 pt-3 flex items-center justify-between">
            <div>
              <span className="block text-sm font-bold text-forest">Default Slip Width</span>
              <span className="text-xs text-mist">Standard image / thermal print width</span>
            </div>
            <div className="flex bg-cream rounded-lg p-0.5 border border-moss/20 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSlipWidthMm(58)}
                className={`px-2.5 py-1 rounded-md ${
                  slipWidthMm === 58 ? 'bg-forest text-white' : 'text-mist'
                }`}
              >
                58 mm
              </button>
              <button
                type="button"
                onClick={() => setSlipWidthMm(80)}
                className={`px-2.5 py-1 rounded-md ${
                  slipWidthMm === 80 ? 'bg-forest text-white' : 'text-mist'
                }`}
              >
                80 mm
              </button>
              <button
                type="button"
                onClick={() => setSlipWidthMm(90)}
                className={`px-2.5 py-1 rounded-md ${
                  slipWidthMm === 90 ? 'bg-forest text-white' : 'text-mist'
                }`}
              >
                90 mm
              </button>
            </div>
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-mist uppercase tracking-wider">
            Data Backup & Restore
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="h-11 bg-white hover:bg-cream border border-moss/30 rounded-xl text-xs font-bold text-forest flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4 text-wheat" />
              <span>Export Backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 bg-white hover:bg-cream border border-moss/30 rounded-xl text-xs font-bold text-forest flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Upload className="w-4 h-4 text-moss" />
              <span>Import Backup</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>

        {/* Device & System Info */}
        <div className="p-3 bg-cream/40 rounded-xl border border-moss/20 text-xs space-y-1">
          <div className="flex justify-between items-center text-mist">
            <span>Device ID:</span>
            <span className="font-mono text-[11px] font-bold text-ink">{deviceId}</span>
          </div>
          <div className="flex justify-between items-center text-mist">
            <span>Storage:</span>
            <span className="flex items-center gap-1 text-moss font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Offline IndexedDB</span>
            </span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-12 left-4 right-4 max-w-md mx-auto bg-forest text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 z-50 text-sm font-semibold animate-fade-in">
          <Check className="w-4 h-4 text-wheat" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
