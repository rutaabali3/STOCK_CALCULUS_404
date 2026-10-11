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
import { RotateCcw, FileText, ArrowRight } from 'lucide-react';

interface WeighProps {
  settings: AppSettings;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onSaveSlip?: (
    result: CalcResult,
    weightsG: number[],
    extras: ExtrasState,
    rateStr: string
  ) => void;
}

export const Weigh: React.FC<WeighProps> = ({
  settings,
  onUpdateSettings,
  onSaveSlip,
}) => {
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

  const handleToggleRounding = (val: boolean) => {
    if (onUpdateSettings) {
      onUpdateSettings({ ...settings, roundToRupee: val });
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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-5">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-3 border-b border-md-outline-variant/20">
        <div>
          <h1 className="text-2xl font-black text-md-on-surface tracking-tight">
            Mandi Weighment
          </h1>
          <p className="text-xs text-md-on-surface-variant font-medium mt-0.5">
            {settings.shopName}
          </p>
        </div>
        <div className="md:hidden">
          <SyncBadge />
        </div>
      </header>

      {/* Responsive Layout Grid:
          - Mobile: Single column with sticky bottom Totals & Actions
          - Desktop (lg+): 2-Column Dashboard with right sticky column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Weight Input, Bag Chips Stream, Extras */}
        <div className="lg:col-span-7 space-y-4">
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

        {/* Right Column (Desktop) & Sticky Bottom Bar (Mobile) */}
        <div className="lg:col-span-5 space-y-3 sticky bottom-0 lg:static bg-md-surface/95 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none pt-2 pb-1 lg:p-0 z-20 border-t lg:border-t-0 border-md-outline-variant/20">
          <TotalsBar
            result={calcResult}
            rateStr={rateStr}
            onRateChange={setRateStr}
            hasTare={Boolean(extras.tareKgStr.trim() && parseDecimal(extras.tareKgStr, 3))}
            roundToRupee={settings.roundToRupee}
            onToggleRoundToRupee={onUpdateSettings ? handleToggleRounding : undefined}
          />

          {calcError && (
            <p className="text-xs text-md-error font-bold text-center px-2 py-1 bg-md-error-container/40 rounded-lg">
              {calcError}
            </p>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2.5 pt-1">
            {/* Reset Button (2-tap confirm) */}
            <button
              type="button"
              onClick={handleResetClick}
              disabled={weightsG.length === 0}
              className={`h-12 sm:h-14 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer select-none border shadow-xs ${
                resetConfirming
                  ? 'bg-md-error text-md-on-error border-transparent shadow-md-2 animate-pulse'
                  : 'bg-md-surface-container-high text-md-on-surface-variant border-md-outline/30 hover:text-md-error hover:border-md-error/50 hover:bg-md-error/10 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{resetConfirming ? 'Confirm?' : 'Reset'}</span>
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
              className="flex-1 h-12 sm:h-14 rounded-2xl bg-md-primary hover:bg-md-primary/90 text-md-on-primary font-bold text-sm sm:text-base shadow-md-2 hover:shadow-md-3 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none"
            >
              <FileText className="w-5 h-5 text-md-tertiary shrink-0" />
              <span>Save & Show Slip</span>
              <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* MD3 Undo Snackbar */}
      {undoToast.show && (
        <div className="fixed bottom-24 md:bottom-8 right-4 left-4 md:left-auto md:w-96 bg-md-inverse-surface text-md-inverse-on-surface px-4 py-3 rounded-2xl shadow-md-3 flex items-center justify-between z-50 animate-fade-in text-sm font-medium border border-white/10">
          <span>{undoToast.message}</span>
          <button
            type="button"
            onClick={handleUndoLast}
            className="text-md-inverse-primary font-bold hover:bg-white/10 px-3 py-1 rounded-full cursor-pointer transition-colors"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
};
