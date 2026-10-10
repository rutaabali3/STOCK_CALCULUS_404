import React from 'react';
import { CalcResult } from 'shared/types';
import { formatDecimal } from 'shared/decimal';
import { ExtrasState } from './ExtrasPanel';

export interface SlipCardProps {
  slipCode: string;
  createdAt: Date;
  shopName: string;
  weightsG: number[];
  calcResult: CalcResult;
  extras: ExtrasState;
  rateStr: string;
  slipWidthMm: 58 | 80 | 90;
  chargeMode: 'add' | 'deduct';
  roundToRupee: boolean;
}

export const SlipCard = React.forwardRef<HTMLDivElement, SlipCardProps>(
  (
    {
      slipCode,
      createdAt,
      shopName,
      weightsG,
      calcResult,
      extras,
      rateStr,
      slipWidthMm,
      chargeMode,
      roundToRupee,
    },
    ref
  ) => {
    // Thermal printer dot widths: 384px for 58mm, 576px for 80mm, 648px for 90mm
    const cardWidthPx =
      slipWidthMm === 90
        ? 'w-[648px]'
        : slipWidthMm === 80
        ? 'w-[576px]'
        : 'w-[384px]';

    // Format date in clean British style: "10 Oct 2026, 1:15 PM"
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(createdAt);

    return (
      <div
        ref={ref}
        className={`${cardWidthPx} bg-white text-ink p-6 border-2 border-ink shadow-md font-sans mx-auto`}
        style={{
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {/* 1. Shop Name */}
        <div className="text-center pb-2">
          <h1 className="text-xl font-black tracking-tight uppercase">
            {shopName}
          </h1>
          <p className="text-[11px] font-bold tracking-widest text-mist uppercase">
            Mandi Commission Shop
          </p>
        </div>

        {/* 2. Slip Code & Date/Time */}
        <div className="flex justify-between items-center text-xs py-1.5 border-y-2 border-ink font-semibold">
          <span>
            Slip: <strong className="font-black text-sm">{slipCode}</strong>
          </span>
          <span className="text-[11px] text-mist">{formattedDate}</span>
        </div>

        {/* 3. Seller / Buyer (if provided) */}
        {(extras.seller.trim() || extras.buyer.trim()) && (
          <div className="py-2 text-xs border-b-2 border-ink space-y-0.5">
            {extras.seller.trim() && (
              <div className="flex justify-between">
                <span className="text-mist font-medium">Seller:</span>
                <span className="font-bold">{extras.seller.trim()}</span>
              </div>
            )}
            {extras.buyer.trim() && (
              <div className="flex justify-between">
                <span className="text-mist font-medium">Buyer:</span>
                <span className="font-bold">{extras.buyer.trim()}</span>
              </div>
            )}
          </div>
        )}

        {/* 4. Bag Weights Grid (5 per row) */}
        <div className="py-3">
          <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider text-mist mb-1.5">
            <span>Bag Weights ({weightsG.length} Bags)</span>
            <span>Weight (kg)</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-bold bg-cream/30 p-2 rounded border border-ink/20">
            {weightsG.map((grams, idx) => (
              <div
                key={`${idx}-${grams}`}
                className="py-1 px-0.5 border border-ink/40 rounded bg-white"
              >
                <span className="block text-[9px] text-mist font-normal">#{idx + 1}</span>
                <span className="tabular-nums text-xs font-black">
                  {formatDecimal(grams, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Summary Breakdown */}
        <div className="border-t-2 border-ink pt-2.5 pb-2 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-mist font-medium">Gross Weight:</span>
            <span className="font-bold tabular-nums">
              {formatDecimal(calcResult.grossG, 3)} kg
            </span>
          </div>

          {calcResult.tareG > 0 && (
            <>
              <div className="flex justify-between text-mist">
                <span>Tare Deduction ({formatDecimal(calcResult.tareG / weightsG.length, 3)} kg × {weightsG.length}):</span>
                <span className="tabular-nums font-semibold">
                  -{formatDecimal(calcResult.tareG, 3)} kg
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Net Weight:</span>
                <span className="tabular-nums">
                  {formatDecimal(calcResult.netG, 3)} kg
                </span>
              </div>
            </>
          )}

          <div className="flex justify-between">
            <span className="text-mist font-medium">Mann Equivalent (1 Mann = 40 kg):</span>
            <span className="font-bold tabular-nums">
              {(calcResult.mannUnitsTimes1000 / 1000).toFixed(3)} Mann
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-mist font-medium">Rate per Mann:</span>
            <span className="font-bold tabular-nums">Rs. {rateStr}</span>
          </div>

          <div className="flex justify-between font-bold pt-1 border-t border-ink/20">
            <span>Base Amount:</span>
            <span className="tabular-nums">
              Rs. {calcResult.amountPaisa / 100 >= 1
                ? (calcResult.amountPaisa / 100).toLocaleString('en-PK', {
                    minimumFractionDigits: roundToRupee ? 0 : 2,
                    maximumFractionDigits: 2,
                  })
                : '0'}
            </span>
          </div>

          {/* Commission & Labour lines if used */}
          {calcResult.commissionPaisa > 0 && (
            <div className="flex justify-between text-mist text-[11px]">
              <span>
                Commission ({extras.commissionType === 'percent' ? `${extras.commissionValStr}%` : 'Fixed'} {chargeMode === 'add' ? 'added' : 'deducted'}):
              </span>
              <span className="font-semibold tabular-nums">
                {chargeMode === 'add' ? '+' : '-'}Rs. {(calcResult.commissionPaisa / 100).toLocaleString('en-PK')}
              </span>
            </div>
          )}

          {calcResult.labourPaisa > 0 && (
            <div className="flex justify-between text-mist text-[11px]">
              <span>
                Labour ({extras.labourType === 'perBag' ? `Rs. ${extras.labourValStr}/bag` : 'Fixed'} {chargeMode === 'add' ? 'added' : 'deducted'}):
              </span>
              <span className="font-semibold tabular-nums">
                {chargeMode === 'add' ? '+' : '-'}Rs. {(calcResult.labourPaisa / 100).toLocaleString('en-PK')}
              </span>
            </div>
          )}
        </div>

        {/* 6. TOTAL PAYABLE */}
        <div className="border-t-4 border-ink pt-2 pb-2 my-1 text-center bg-cream/40 rounded">
          <span className="block text-xs font-black tracking-widest text-mist uppercase">
            TOTAL PAYABLE
          </span>
          <div className="text-3xl font-black tracking-tight tabular-nums mt-0.5">
            Rs. {roundToRupee
              ? calcResult.totalRupees.toLocaleString('en-PK')
              : calcResult.totalRupees.toLocaleString('en-PK', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
          </div>
        </div>

        {/* 7. Note if provided */}
        {extras.note.trim() && (
          <div className="pt-2 text-xs border-t border-ink/30 text-mist italic">
            <strong>Note:</strong> {extras.note.trim()}
          </div>
        )}

        {/* 8. Footer */}
        <div className="pt-3 text-center border-t-2 border-ink text-[10px] font-bold text-mist uppercase tracking-wider">
          Standard: 1 Mann = 40 kg • Computer Generated Slip
        </div>
      </div>
    );
  }
);

SlipCard.displayName = 'SlipCard';
