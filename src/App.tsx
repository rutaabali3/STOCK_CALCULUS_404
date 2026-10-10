import { useState, useEffect } from 'react';
import { Weigh } from './routes/Weigh';
import { SlipView, SlipData } from './routes/SlipView';
import { History } from './routes/History';
import { Settings } from './routes/Settings';
import { loadSettings, saveSettings, AppSettings } from './lib/settings';
import {
  saveSlipRecord,
  LocalSlipRecord,
  getStoredSettings,
  setStoredSettings,
  getOrCreateDeviceId,
  requestPersistentStorage,
} from './lib/db';
import { ulid } from 'ulid';
import { CalcResult, SlipPayload } from 'shared/types';
import { ExtrasState } from './components/ExtrasPanel';
import { formatDecimal } from 'shared/decimal';
import { Scale, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import { InstallPrompt } from './components/InstallPrompt';
import { UpdatePrompt } from './components/UpdatePrompt';

type ActiveTab = 'weigh' | 'history' | 'settings' | 'slip';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [activeTab, setActiveTab] = useState<ActiveTab>('weigh');
  const [currentSlip, setCurrentSlip] = useState<SlipData | null>(null);

  useEffect(() => {
    // Attempt persistent storage request on load
    requestPersistentStorage();

    // Sync settings from IndexedDB if present
    getStoredSettings().then((stored) => {
      setSettings(stored);
    });
  }, []);

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    await setStoredSettings(newSettings);
  };

  const handleSaveSlip = async (
    result: CalcResult,
    weightsG: number[],
    extras: ExtrasState,
    rateStr: string
  ) => {
    const id = ulid();
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const suffix = id.slice(-4).toUpperCase();
    const slipCode = `${mm}${dd}-${suffix}`;

    // Construct SlipPayload
    const payload: SlipPayload = {
      id,
      createdAt: now.toISOString(),
      deviceId: getOrCreateDeviceId(),
      seller: extras.seller.trim() || undefined,
      buyer: extras.buyer.trim() || undefined,
      note: extras.note.trim() || undefined,
      weightsG,
      ratePaisa: result.amountPaisa > 0 ? Math.round((result.amountPaisa * 40000) / result.netG) : 0,
      tarePerBagG: result.bagCount > 0 ? Math.round(result.tareG / result.bagCount) : 0,
      chargeMode: settings.chargeMode,
      roundToRupee: settings.roundToRupee,
    };

    const record: LocalSlipRecord = {
      id,
      slipCode,
      createdAt: now.toISOString(),
      payload,
      calcResult: result,
      syncStatus: 'pending',
    };

    // Save directly to IndexedDB before showing slip
    await saveSlipRecord(record);

    const newSlip: SlipData = {
      slipCode,
      createdAt: now,
      weightsG,
      calcResult: result,
      extras,
      rateStr,
    };

    setCurrentSlip(newSlip);
    setActiveTab('slip');
  };

  const handleSelectHistorySlip = (record: LocalSlipRecord) => {
    const slipData: SlipData = {
      slipCode: record.slipCode,
      createdAt: new Date(record.createdAt),
      weightsG: record.payload.weightsG,
      calcResult: record.calcResult,
      extras: {
        tareKgStr: record.payload.tarePerBagG > 0 ? formatDecimal(record.payload.tarePerBagG, 3) : '',
        commissionType: 'percent',
        commissionValStr: '',
        labourType: 'perBag',
        labourValStr: '',
        seller: record.payload.seller || '',
        buyer: record.payload.buyer || '',
        note: record.payload.note || '',
      },
      rateStr: formatDecimal(record.payload.ratePaisa, 2),
    };
    setCurrentSlip(slipData);
    setActiveTab('slip');
  };

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col justify-between">
      <UpdatePrompt />
      <InstallPrompt />

      {/* Route Content */}
      <main className="flex-1">
        {activeTab === 'weigh' && (
          <Weigh settings={settings} onSaveSlip={handleSaveSlip} />
        )}

        {activeTab === 'history' && (
          <History
            onSelectSlip={handleSelectHistorySlip}
            onBack={() => setActiveTab('weigh')}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onBack={() => setActiveTab('weigh')}
          />
        )}

        {activeTab === 'slip' && currentSlip && (
          <SlipView
            slipData={currentSlip}
            settings={settings}
            onNewWeighing={() => {
              setCurrentSlip(null);
              setActiveTab('weigh');
            }}
            onBackToWeighing={() => setActiveTab('weigh')}
          />
        )}
      </main>

      {/* Global Bottom Navigation Bar (hidden on SlipView for full receipt space) */}
      {activeTab !== 'slip' && (
        <nav className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-moss/20 py-2 px-6 flex justify-around items-center z-40 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('weigh')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'weigh'
                ? 'text-forest font-black scale-105'
                : 'text-mist hover:text-ink font-semibold'
            }`}
          >
            <Scale className="w-5 h-5" />
            <span className="text-[11px]">Weigh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'text-forest font-black scale-105'
                : 'text-mist hover:text-ink font-semibold'
            }`}
          >
            <HistoryIcon className="w-5 h-5" />
            <span className="text-[11px]">History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-forest font-black scale-105'
                : 'text-mist hover:text-ink font-semibold'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-[11px]">Settings</span>
          </button>
        </nav>
      )}
    </div>
  );
}
