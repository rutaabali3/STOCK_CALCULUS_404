import React from 'react';
import { CalcResult } from 'shared/types';
import { formatDecimal } from 'shared/decimal';

interface TotalsBarProps {
  result: CalcResult | null;
  rateStr: string;
  onRateChange: (rate: string) => void;
  hasTare: boolean;
  roundToRupee: boolean;
  onToggleRoundToRupee?: (val: boolean) => void;
}

export const TotalsBar: React.FC<TotalsBarProps> = ({
  result,
  rateStr,
  onRateChange,
  hasTare,
  roundToRupee,
  onToggleRoundToRupee,
}) => {
  return (
    <div className="w-full bg-md-surface-container text-md-on-surface rounded-3xl p-4 sm:p-5 shadow-md-2 border border-md-outline-variant/30 space-y-3.5">
      {/* Metrics Row (3-Pill Grid) */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-md-surface-container-high rounded-2xl p-2.5 sm:p-3 border border-md-outline-variant/20 shadow-xs">
          <span className="block text-[11px] uppercase tracking-wider text-md-on-surface-variant font-bold">
            Total Bags
          </span>
          <span className="text-lg sm:text-xl font-black tracking-tight text-md-on-surface tabular-nums">
            {result ? result.bagCount : '0'}
          </span>
        </div>

        <div className="bg-md-surface-container-high rounded-2xl p-2.5 sm:p-3 border border-md-outline-variant/20 shadow-xs">
          <span className="block text-[11px] uppercase tracking-wider text-md-on-surface-variant font-bold">
            Gross Weight
          </span>
          <span className="text-lg sm:text-xl font-black tracking-tight text-md-on-surface tabular-nums truncate">
            {result ? `${formatDecimal(result.grossG, 3)} kg` : '0 kg'}
          </span>
        </div>

        <div className="bg-md-surface-container-high rounded-2xl p-2.5 sm:p-3 border border-md-outline-variant/20 shadow-xs">
          <span className="block text-[11px] uppercase tracking-wider text-md-tertiary font-bold">
            Mann (40kg)
          </span>
          <span className="text-lg sm:text-xl font-black tracking-tight text-md-tertiary tabular-nums">
            {result ? (result.mannUnitsTimes1000 / 1000).toFixed(3) : '0.000'}
          </span>
        </div>
      </div>

      {/* Tare / Net weight row if tare is active */}
      {hasTare && result && (
        <div className="flex justify-between items-center text-xs px-3.5 py-2 bg-md-secondary-container/70 text-md-on-secondary-container rounded-xl border border-md-outline-variant/20 font-medium">
          <span>
            Tare:{' '}
            <strong className="font-bold tabular-nums">
              {formatDecimal(result.tareG, 3)} kg
            </strong>
          </span>
          <span>
            Net Weight:{' '}
            <strong className="font-bold text-md-primary tabular-nums">
              {formatDecimal(result.netG, 3)} kg
            </strong>
          </span>
        </div>
      )}

      {/* Rate input and Total Payable */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-md-outline-variant/20">
        <div className="w-1/2">
          <label className="block text-xs font-semibold text-md-on-surface-variant mb-1">
            Rate / Mann
          </label>
          <div className="relative flex items-center h-12 bg-md-surface-container-lowest border border-md-outline/40 rounded-xl focus-within:border-2 focus-within:border-md-primary focus-within:ring-2 focus-within:ring-md-primary/15 transition-all shadow-xs">
            <span className="pl-3 text-xs font-bold text-md-on-surface-variant pointer-events-none select-none">
              Rs.
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="2000"
              value={rateStr}
              onChange={(e) => onRateChange(e.target.value)}
              className="w-full h-full pl-2 pr-3 text-lg font-black bg-transparent text-md-on-surface placeholder:text-md-on-surface-variant/40 focus:outline-none tabular-nums"
            />
          </div>
        </div>

        <div className="w-1/2 text-right">
          <div className="flex items-center justify-end gap-1.5 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-md-tertiary">
              Total Payable
            </span>
            {onToggleRoundToRupee && (
              <button
                type="button"
                onClick={() => onToggleRoundToRupee(!roundToRupee)}
                title="Tap to toggle whole rupee rounding"
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full border transition-all cursor-pointer ${
                  roundToRupee
                    ? 'bg-md-primary text-md-on-primary border-md-primary shadow-xs'
                    : 'bg-md-surface-container-high text-md-on-surface-variant border-md-outline/40 hover:border-md-outline'
                }`}
              >
                {roundToRupee ? 'Round: ON' : 'Round: OFF'}
              </button>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-md-on-surface tracking-tight tabular-nums truncate">
            Rs.{' '}
            {result
              ? roundToRupee
                ? result.totalRupees.toLocaleString('en-PK')
                : result.totalRupees.toLocaleString('en-PK', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
              : '0'}
          </div>
        </div>
      </div>
    </div>
  );
};
