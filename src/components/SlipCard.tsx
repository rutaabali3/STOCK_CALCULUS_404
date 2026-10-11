import React from 'react';
import { CalcResult } from 'shared/types';
import { formatDecimal } from 'shared/decimal';
import { ExtrasState } from './ExtrasPanel';
import { SlipCustomization } from '../lib/settings';

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
  customization?: SlipCustomization;
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
      customization,
    },
    ref
  ) => {
    // Thermal printer dot widths: 384px for 58mm, 576px for 80mm, 648px for 90mm
    const targetWidthPx =
      slipWidthMm === 90
        ? 648
        : slipWidthMm === 80
        ? 576
        : 384;

    const compact = Boolean(customization?.compactMode);
    const fontSize = customization?.fontSize || 'base';

    const showBags = customization?.showBagsGrid !== false;
    const showParties = customization?.showParties !== false;
    const showCode = customization?.showSlipCode !== false;
    const showDate = customization?.showDate !== false;
    const showGross = customization?.showGrossWeight !== false;
    const showTare = customization?.showTare !== false;
    const showNet = customization?.showNetWeight !== false;
    const showMann = customization?.showMann !== false;
    const showRate = customization?.showRate !== false;
    const showBase = customization?.showBaseAmount !== false;
    const showFooter = customization?.showFooter !== false;

    // Font size scaling classes
    const textScale =
      fontSize === 'sm'
        ? {
            title: 'text-lg',
            subtitle: 'text-[10px]',
            body: 'text-[11px]',
            meta: 'text-[10px]',
            gridText: 'text-[11px]',
            badgeText: 'text-[8px]',
            total: 'text-2xl',
          }
        : fontSize === 'lg'
        ? {
            title: 'text-2xl',
            subtitle: 'text-xs',
            body: 'text-sm',
            meta: 'text-xs',
            gridText: 'text-sm',
            badgeText: 'text-[10px]',
            total: 'text-4xl',
          }
        : {
            title: 'text-xl',
            subtitle: 'text-[11px]',
            body: 'text-xs',
            meta: 'text-[11px]',
            gridText: 'text-xs',
            badgeText: 'text-[9px]',
            total: 'text-3xl',
          };

    // Format date in clean British style: "10 Oct 2026, 1:15 PM"
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(createdAt);

    const subtitle =
      customization?.shopSubtitle !== undefined
        ? customization.shopSubtitle.trim()
        : 'Mandi Commission Shop';
    const address = customization?.shopAddress?.trim();
    const phone = customization?.shopPhone?.trim();
    const footerText =
      customization?.footerText !== undefined && customization.footerText.trim() !== ''
        ? customization.footerText.trim()
        : 'Standard: 1 Mann = 40 kg • Computer Generated Slip';

    return (
      <div
        ref={ref}
        className={`bg-white text-ink ${
          compact ? 'p-3.5 sm:p-4' : 'p-6'
        } border-2 border-ink shadow-md font-sans mx-auto shrink-0 flex-none box-border ${textScale.body}`}
        style={{
          width: `${targetWidthPx}px`,
          minWidth: `${targetWidthPx}px`,
          maxWidth: `${targetWidthPx}px`,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {/* 1. Shop Header */}
        <div className={`text-center ${compact ? 'pb-1.5' : 'pb-2'}`}>
          <h1 className={`${textScale.title} font-black tracking-tight uppercase leading-tight`}>
            {shopName}
          </h1>
          {subtitle && (
            <p className={`${textScale.subtitle} font-bold tracking-widest text-mist uppercase mt-0.5`}>
              {subtitle}
            </p>
          )}
          {address && (
            <p className={`${textScale.meta} font-semibold text-mist/90 mt-0.5`}>
              {address}
            </p>
          )}
          {phone && (
            <p className={`${textScale.meta} font-bold text-ink mt-0.5`}>
              Tel: {phone}
            </p>
          )}
        </div>

        {/* Receipt Name / Lot Title (if provided) */}
        {extras.receiptName?.trim() && (
          <div className="py-1 px-2 mb-2 text-center bg-cream/60 rounded border border-ink/30">
            <span className="text-xs font-black tracking-wider uppercase text-forest">
              {extras.receiptName.trim()}
            </span>
          </div>
        )}

        {/* 2. Slip Code & Date/Time */}
        {(showCode || showDate) && (
          <div
            className={`flex justify-between items-center ${textScale.meta} ${
              compact ? 'py-1' : 'py-1.5'
            } border-y-2 border-ink font-semibold`}
          >
            {showCode ? (
              <span>
                Slip: <strong className="font-black text-sm">{slipCode}</strong>
              </span>
            ) : (
              <span />
            )}
            {showDate && <span className="text-mist">{formattedDate}</span>}
          </div>
        )}

        {/* 3. Seller / Buyer (if provided & enabled) */}
        {showParties && (extras.seller.trim() || extras.buyer.trim()) && (
          <div className={`${compact ? 'py-1.5' : 'py-2'} border-b-2 border-ink space-y-0.5`}>
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
        {showBags && weightsG.length > 0 && (
          <div className={compact ? 'py-2' : 'py-3'}>
            <div className={`flex justify-between items-center ${textScale.meta} font-black uppercase tracking-wider text-mist mb-1.5`}>
              <span>Bag Weights ({weightsG.length} Bags)</span>
              <span>Weight (kg)</span>
            </div>

            <div className={`grid grid-cols-5 ${compact ? 'gap-1 p-1.5' : 'gap-1.5 p-2'} text-center font-bold bg-cream/30 rounded border border-ink/20`}>
              {weightsG.map((grams, idx) => (
                <div
                  key={`${idx}-${grams}`}
                  className={`${compact ? 'py-0.5 px-0.5' : 'py-1 px-0.5'} border border-ink/40 rounded bg-white`}
                >
                  <span className={`block ${textScale.badgeText} text-mist font-normal`}>#{idx + 1}</span>
                  <span className={`tabular-nums ${textScale.gridText} font-black`}>
                    {formatDecimal(grams, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Summary Breakdown */}
        <div className={`border-t-2 border-ink ${compact ? 'pt-2 pb-1.5 space-y-0.5' : 'pt-2.5 pb-2 space-y-1'}`}>
          {showGross && (
            <div className="flex justify-between">
              <span className="text-mist font-medium">Gross Weight:</span>
              <span className="font-bold tabular-nums">
                {formatDecimal(calcResult.grossG, 3)} kg
              </span>
            </div>
          )}

          {calcResult.tareG > 0 && (
            <>
              {showTare && (
                <div className="flex justify-between text-mist">
                  <span>Tare Deduction ({formatDecimal(calcResult.tareG / weightsG.length, 3)} kg × {weightsG.length}):</span>
                  <span className="tabular-nums font-semibold">
                    -{formatDecimal(calcResult.tareG, 3)} kg
                  </span>
                </div>
              )}
              {showNet && (
                <div className="flex justify-between font-bold">
                  <span>Net Weight:</span>
                  <span className="tabular-nums">
                    {formatDecimal(calcResult.netG, 3)} kg
                  </span>
                </div>
              )}
            </>
          )}

          {showMann && (
            <div className="flex justify-between">
              <span className="text-mist font-medium">Mann Equivalent (1 Mann = 40 kg):</span>
              <span className="font-bold tabular-nums">
                {(calcResult.mannUnitsTimes1000 / 1000).toFixed(3)} Mann
              </span>
            </div>
          )}

          {showRate && (
            <div className="flex justify-between">
              <span className="text-mist font-medium">Rate per Mann:</span>
              <span className="font-bold tabular-nums">Rs. {rateStr}</span>
            </div>
          )}

          {showBase && (
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
          )}

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
        <div className={`border-t-4 border-ink ${compact ? 'pt-1.5 pb-1.5 my-1' : 'pt-2 pb-2 my-1'} text-center bg-cream/40 rounded`}>
          <span className="block text-xs font-black tracking-widest text-mist uppercase">
            TOTAL PAYABLE
          </span>
          <div className={`${textScale.total} font-black tracking-tight tabular-nums mt-0.5`}>
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
        {showFooter && (
          <div className={`${compact ? 'pt-2' : 'pt-3'} text-center border-t-2 border-ink ${textScale.meta} font-bold text-mist uppercase tracking-wider`}>
            {footerText}
          </div>
        )}
      </div>
    );
  }
);

SlipCard.displayName = 'SlipCard';

