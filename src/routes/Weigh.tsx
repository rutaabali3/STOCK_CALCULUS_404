import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WeightInput } from '../components/WeightInput';
import { BagChips } from '../components/BagChips';
import { TotalsBar } from '../components/TotalsBar';
import { ExtrasPanel, ExtrasState } from '../components/ExtrasPanel';
import { SyncBadge } from '../components/SyncBadge';
import { computeSlip } from 'shared/calc';
import { parseDecimal, formatDecimal } from 'shared/decimal';
import { CalcInput, CalcResult } from 'shared/types';
import { AppSettings } from '../lib/settings';
import { RotateCcw, FileText } from 'lucide-react';

interface WeighProps {
  settings: AppSettings;
  onSaveSlip?: (
    result: CalcResult,
    weightsG: number[],
    extras: ExtrasState,
    rateStr: string
  ) => void;
}

export const Weigh: React.FC<WeighProps> = ({ settings, onSaveSlip }) => {
  const [weightsG, setWeightsG] = useState<number[]>([]);
  const [rateStr, setRateStr] = useState<string>(() =>
    formatDecimal(settings.defaultRatePaisa, 2)
  );

  const [extras, setExtras] = useState<ExtrasState>({
    tareKgStr: settings.defaultTareG > 0 ? formatDecimal(settings.defaultTareG, 3) : '',
    commissionType: 'percent',
    commissionValStr: '',
    labourType: 'perBag',
    labourValStr: '',
    seller: '',
    buyer: '',
    note: '',
  });

  const [removedHistory, setRemovedHistory] = useState<{ grams: number; index: number }[]>([]);
  const [undoToast, setUndoToast] = useState<{ message: string; show: boolean }>({
    message: '',
    show: false,
  });
  const toastTimeoutRef = useRef<number | null>(null);

  const [resetConfirming, setResetConfirming] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  // Screen Wake Lock API
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if ('wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((lock) => {
          wakeLock = lock;
        })
        .catch(() => {
          // Ignore wake lock rejection
        });
    }
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  const handleAddWeight = (grams: number) => {
    setWeightsG((prev) => [...prev, grams]);
  };

  const handleRemoveIndex = (index: number) => {
    const item = weightsG[index];
    if (item === undefined) return;

    setRemovedHistory((prev) => [...prev, { grams: item, index }]);
    setWeightsG((prev) => prev.filter((_, i) => i !== index));

    // Show undo toast
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setUndoToast({
      message: `Bag #${index + 1} (${formatDecimal(item, 3)} kg) removed`,
      show: true,
    });
    toastTimeoutRef.current = window.setTimeout(() => {
      setUndoToast({ message: '', show: false });
    }, 5000);
  };

  const handleUndoLast = () => {
    if (removedHistory.length === 0) return;
    const last = removedHistory[removedHistory.length - 1];
    if (!last) return;

    setRemovedHistory((prev) => prev.slice(0, -1));
    setWeightsG((prev) => {
      const next = [...prev];
      next.splice(last.index, 0, last.grams);
      return next;
    });

    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    setUndoToast({ message: '', show: false });
  };

  const handleResetClick = () => {
    if (!resetConfirming) {
      setResetConfirming(true);
      resetTimerRef.current = window.setTimeout(() => {
        setResetConfirming(false);
      }, 3000);
    } else {
      // Confirmed second tap
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      setResetConfirming(false);
      setWeightsG([]);
      setRemovedHistory([]);
      setExtras((prev) => ({
        ...prev,
        tareKgStr: settings.defaultTareG > 0 ? formatDecimal(settings.defaultTareG, 3) : '',
        commissionValStr: '',
        labourValStr: '',
        seller: '',
        buyer: '',
        note: '',
      }));
    }
  };

  // Compute live calculation result
  const { calcResult, calcError } = useMemo(() => {
    if (weightsG.length === 0) {
      return { calcResult: null, calcError: null };
    }

    const ratePaisa = parseDecimal(rateStr, 2);
    if (ratePaisa === null || ratePaisa < 0) {
      return { calcResult: null, calcError: 'Please enter a valid rate per Mann' };
    }

    const tarePerBagG = extras.tareKgStr.trim() ? (parseDecimal(extras.tareKgStr, 3) ?? 0) : 0;

    // Commission
    let commission = undefined;
    if (extras.commissionValStr.trim()) {
      if (extras.commissionType === 'percent') {
        const hundredthsPct = parseDecimal(extras.commissionValStr, 2);
        if (hundredthsPct !== null && hundredthsPct >= 0) {
          commission = { type: 'percent' as const, hundredthsPct };
        }
      } else {
        const paisa = parseDecimal(extras.commissionValStr, 2);
        if (paisa !== null && paisa >= 0) {
          commission = { type: 'fixed' as const, paisa };
        }
      }
    }

    // Labour
    let labour = undefined;
    if (extras.labourValStr.trim()) {
      const paisa = parseDecimal(extras.labourValStr, 2);
      if (paisa !== null && paisa >= 0) {
        labour = { type: extras.labourType, paisa };
      }
    }

    const input: CalcInput = {
      weightsG,
      ratePaisa,
      tarePerBagG,
      commission,
      labour,
      chargeMode: settings.chargeMode,
      roundToRupee: settings.roundToRupee,
    };

    try {
      const res = computeSlip(input);
      return { calcResult: res, calcError: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid calculation parameters';
      return { calcResult: null, calcError: message };
    }
  }, [weightsG, rateStr, extras, settings]);

  const canSave = Boolean(calcResult && !calcError && weightsG.length > 0);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between p-4 pb-8 space-y-4">
      {/* Top section: Header & Weight input */}
      <div className="space-y-4">
        <header className="flex items-center justify-between pb-2 border-b border-moss/20">
          <div>
            <h1 className="text-xl font-black text-forest tracking-tight">
              Mandi Weighment
            </h1>
            <p className="text-xs text-mist font-medium">{settings.shopName}</p>
          </div>
          <SyncBadge />
        </header>

        <WeightInput onAddWeight={handleAddWeight} />

        <BagChips
          weightsG={weightsG}
          onRemoveIndex={handleRemoveIndex}
          onUndoLast={handleUndoLast}
          canUndo={removedHistory.length > 0}
        />

        <ExtrasPanel
          extras={extras}
          onChange={(upd) => setExtras((prev) => ({ ...prev, ...upd }))}
          chargeMode={settings.chargeMode}
        />
      </div>

      {/* Undo Toast */}
      {undoToast.show && (
        <div className="fixed bottom-36 left-4 right-4 max-w-md mx-auto bg-ink text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between z-50 animate-fade-in text-sm font-medium">
          <span>{undoToast.message}</span>
          <button
            type="button"
            onClick={handleUndoLast}
            className="text-wheat font-bold hover:underline px-2 py-0.5"
          >
            Undo
          </button>
        </div>
      )}

      {/* Sticky Bottom Section: Totals & Action Buttons */}
      <div className="sticky bottom-0 bg-cream/95 backdrop-blur-md pt-2 space-y-3 z-20">
        <TotalsBar
          result={calcResult}
          rateStr={rateStr}
          onRateChange={setRateStr}
          hasTare={Boolean(extras.tareKgStr.trim() && parseDecimal(extras.tareKgStr, 3))}
          roundToRupee={settings.roundToRupee}
        />

        {calcError && (
          <p className="text-xs text-red-600 font-semibold text-center">{calcError}</p>
        )}

        <div className="flex items-center gap-2">
          {/* Reset Button (2-tap confirm) */}
          <button
            type="button"
            onClick={handleResetClick}
            disabled={weightsG.length === 0}
            className={`h-12 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 border ${
              resetConfirming
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-white text-mist border-moss/20 hover:text-red-600 disabled:opacity-40'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{resetConfirming ? 'Tap to Confirm' : 'Reset'}</span>
          </button>

          {/* Save & Show Slip Button */}
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (canSave && calcResult && onSaveSlip) {
                onSaveSlip(calcResult, weightsG, extras, rateStr);
              }
            }}
            className="flex-1 h-12 bg-forest hover:bg-forest/90 active:scale-[0.99] text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <FileText className="w-5 h-5 text-wheat" />
            <span>Save & Show Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
