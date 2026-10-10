import React from 'react';
import { CalcResult } from 'shared/types';
import { formatDecimal } from 'shared/decimal';

interface TotalsBarProps {
  result: CalcResult | null;
  rateStr: string;
  onRateChange: (rate: string) => void;
  hasTare: boolean;
  roundToRupee: boolean;
}

export const TotalsBar: React.FC<TotalsBarProps> = ({
  result,
  rateStr,
  onRateChange,
  hasTare,
  roundToRupee,
}) => {
  return (
    <div className="w-full bg-forest text-cream rounded-2xl p-4 shadow-xl border border-moss/30 space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 pb-3 border-b border-moss/30 text-center">
        <div>
          <span className="block text-[11px] uppercase tracking-wider text-cream/70 font-medium">
            Total Bags
          </span>
          <span className="text-xl font-bold tracking-tight text-white tabular-nums">
            {result ? result.bagCount : '0'}
          </span>
        </div>

        <div>
          <span className="block text-[11px] uppercase tracking-wider text-cream/70 font-medium">
            Gross Weight
          </span>
          <span className="text-xl font-bold tracking-tight text-white tabular-nums">
            {result ? `${formatDecimal(result.grossG, 3)} kg` : '0 kg'}
          </span>
        </div>

        <div>
          <span className="block text-[11px] uppercase tracking-wider text-cream/70 font-medium">
            Mann (40kg)
          </span>
          <span className="text-xl font-bold tracking-tight text-wheat tabular-nums">
            {result ? (result.mannUnitsTimes1000 / 1000).toFixed(3) : '0.000'}
          </span>
        </div>
      </div>

      {/* Tare / Net weight row if tare is active */}
      {hasTare && result && (
        <div className="flex justify-between items-center text-xs px-1 text-cream/80 bg-forest-dark/40 py-1.5 px-3 rounded-lg border border-moss/20">
          <span>Tare: <strong className="text-white tabular-nums">{formatDecimal(result.tareG, 3)} kg</strong></span>
          <span>Net Weight: <strong className="text-wheat tabular-nums">{formatDecimal(result.netG, 3)} kg</strong></span>
        </div>
      )}

      {/* Rate input and Total Payable */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="w-1/2">
          <label className="block text-xs font-semibold text-cream/80 mb-1">
            Rate / Mann (Rs)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="2000"
            value={rateStr}
            onChange={(e) => onRateChange(e.target.value)}
            className="w-full h-12 px-3 text-lg font-bold bg-cream text-ink border-2 border-wheat/60 rounded-xl focus:border-wheat focus:outline-none tabular-nums shadow-inner"
          />
        </div>

        <div className="w-1/2 text-right">
          <span className="block text-xs font-semibold uppercase tracking-wider text-wheat mb-0.5">
            Total Payable
          </span>
          <div className="text-2xl font-black text-white tracking-tight tabular-nums truncate">
            Rs. {result
              ? (roundToRupee
                  ? result.totalRupees.toLocaleString('en-PK')
                  : result.totalRupees.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
              : '0'}
          </div>
        </div>
      </div>
    </div>
  );
};
