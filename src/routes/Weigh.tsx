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
import { Md3Button } from '../components/md3/Md3Button';

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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top App Bar / Header */}
      <header className="flex items-center justify-between pb-4 border-b border-md-outline-variant/20">
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

      {/* Responsive 2-Column Grid on Tablet & Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input, Bag Stream, Extras */}
        <div className="lg:col-span-7 space-y-5">
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

        {/* Right Column: Totals Bar, Errors & Action Buttons */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <TotalsBar
            result={calcResult}
            rateStr={rateStr}
            onRateChange={setRateStr}
            hasTare={Boolean(extras.tareKgStr.trim() && parseDecimal(extras.tareKgStr, 3))}
            roundToRupee={settings.roundToRupee}
          />

          {calcError && (
            <p className="text-xs text-md-error font-bold text-center px-2 py-1 bg-md-error-container/40 rounded-lg">
              {calcError}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            {/* Reset Button (2-tap confirm) */}
            <button
              type="button"
              onClick={handleResetClick}
              disabled={weightsG.length === 0}
              className={`h-13 px-5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer select-none border ${
                resetConfirming
                  ? 'bg-md-error text-md-on-error border-transparent shadow-md-2 animate-pulse'
                  : 'bg-md-surface-container-low text-md-on-surface-variant border-md-outline-variant hover:text-md-error hover:border-md-error/50 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{resetConfirming ? 'Tap to Confirm' : 'Reset'}</span>
            </button>

            {/* Save & Show Slip Button */}
            <Md3Button
              variant="filled"
              size="lg"
              disabled={!canSave}
              onClick={() => {
                if (canSave && calcResult && onSaveSlip) {
                  onSaveSlip(calcResult, weightsG, extras, rateStr);
                }
              }}
              icon={<FileText className="w-5 h-5 text-md-tertiary" />}
              trailingIcon={<ArrowRight className="w-4 h-4 ml-1" />}
              className="flex-1 h-13 shadow-md-2 hover:shadow-md-3"
            >
              Save & Show Slip
            </Md3Button>
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
