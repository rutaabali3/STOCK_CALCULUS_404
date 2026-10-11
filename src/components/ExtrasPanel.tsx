import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { Md3SegmentedButton } from './md3/Md3SegmentedButton';
import { Md3TextField } from './md3/Md3TextField';

export interface ExtrasState {
  receiptName?: string;
  tareKgStr: string;
  commissionType: 'percent' | 'fixed';
  commissionValStr: string;
  labourType: 'fixed' | 'perBag';
  labourValStr: string;
  seller: string;
  buyer: string;
  note: string;
}

interface ExtrasPanelProps {
  extras: ExtrasState;
  onChange: (updated: Partial<ExtrasState>) => void;
  chargeMode: 'add' | 'deduct';
}

export const ExtrasPanel: React.FC<ExtrasPanelProps> = ({
  extras,
  onChange,
  chargeMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveExtras =
    Boolean(extras.receiptName?.trim()) ||
    Boolean(extras.tareKgStr.trim()) ||
    Boolean(extras.commissionValStr.trim()) ||
    Boolean(extras.labourValStr.trim()) ||
    Boolean(extras.seller.trim()) ||
    Boolean(extras.buyer.trim()) ||
    Boolean(extras.note.trim());

  return (
    <div className="w-full bg-md-surface-container-low rounded-2xl border border-md-outline-variant/30 shadow-xs overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 flex items-center justify-between text-start hover:bg-md-surface-container transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-md-primary" />
          <span className="text-sm font-bold text-md-on-surface">
            Additional Details & Extras
          </span>
          {hasActiveExtras && (
            <span className="w-2.5 h-2.5 rounded-full bg-md-tertiary animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-md-on-surface-variant font-semibold">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-2 border-t border-md-outline-variant/20 space-y-4 bg-md-surface-container-lowest/50">
          {/* Receipt / Lot Name */}
          <Md3TextField
            label="Receipt Name / Lot Title (Optional)"
            placeholder="e.g. Aslam Wheat, Lot #4"
            maxLength={120}
            value={extras.receiptName || ''}
            onChange={(e) => onChange({ receiptName: e.target.value })}
          />

          {/* Tare Weight */}
          <Md3TextField
            label="Tare / Deduction Per Bag"
            placeholder="e.g. 1"
            inputMode="decimal"
            suffix="kg"
            value={extras.tareKgStr}
            onChange={(e) => onChange({ tareKgStr: e.target.value })}
          />

          {/* Commission Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant">
                Commission ({chargeMode === 'add' ? 'Added' : 'Deducted'})
              </label>
              <Md3SegmentedButton<'percent' | 'fixed'>
                size="sm"
                value={extras.commissionType}
                onChange={(val) => onChange({ commissionType: val })}
                options={[
                  { value: 'percent', label: '%' },
                  { value: 'fixed', label: 'Rs.' },
                ]}
              />
            </div>
            <Md3TextField
              placeholder={
                extras.commissionType === 'percent'
                  ? 'e.g. 2 for 2%'
                  : 'Fixed Rs. (e.g. 500)'
              }
              inputMode="decimal"
              value={extras.commissionValStr}
              onChange={(e) => onChange({ commissionValStr: e.target.value })}
            />
          </div>

          {/* Labour Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant">
                Labour / Mazdoori ({chargeMode === 'add' ? 'Added' : 'Deducted'})
              </label>
              <Md3SegmentedButton<'perBag' | 'fixed'>
                size="sm"
                value={extras.labourType}
                onChange={(val) => onChange({ labourType: val })}
                options={[
                  { value: 'perBag', label: 'Per Bag' },
                  { value: 'fixed', label: 'Total Rs.' },
                ]}
              />
            </div>
            <Md3TextField
              placeholder={
                extras.labourType === 'perBag'
                  ? 'Rs. per bag (e.g. 10)'
                  : 'Total Rs. (e.g. 50)'
              }
              inputMode="decimal"
              value={extras.labourValStr}
              onChange={(e) => onChange({ labourValStr: e.target.value })}
            />
          </div>

          {/* Seller / Buyer Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Md3TextField
              label="Seller (Optional)"
              placeholder="Seller name"
              maxLength={120}
              value={extras.seller}
              onChange={(e) => onChange({ seller: e.target.value })}
            />
            <Md3TextField
              label="Buyer (Optional)"
              placeholder="Buyer name"
              maxLength={120}
              value={extras.buyer}
              onChange={(e) => onChange({ buyer: e.target.value })}
            />
          </div>

          {/* Note */}
          <Md3TextField
            label="Note / Remarks (Optional)"
            placeholder="e.g. Lot #12, Wheat Grade A"
            maxLength={500}
            value={extras.note}
            onChange={(e) => onChange({ note: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};
