import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    <div className="w-full bg-white rounded-xl border border-moss/20 shadow-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-start hover:bg-cream/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-forest">Additional Details & Extras</span>
          {hasActiveExtras && (
            <span className="w-2 h-2 rounded-full bg-wheat" />
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-mist font-semibold">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-2 border-t border-moss/10 space-y-4 bg-cream/10">
          {/* Receipt / Lot Name */}
          <div>
            <label className="block text-xs font-semibold text-mist mb-1">
              Receipt Name / Lot Title (Optional)
            </label>
            <input
              type="text"
              maxLength={120}
              placeholder="e.g. Aslam Wheat, Lot #4"
              value={extras.receiptName || ''}
              onChange={(e) => onChange({ receiptName: e.target.value })}
              className="w-full h-11 px-3 text-sm bg-white border border-moss/30 rounded-lg focus:border-forest focus:outline-none font-medium"
            />
          </div>

          {/* Tare Weight */}
          <div>
            <label className="block text-xs font-semibold text-mist mb-1">
              Tare / Deduction Per Bag (kg)
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 1"
              value={extras.tareKgStr}
              onChange={(e) => onChange({ tareKgStr: e.target.value })}
              className="w-full h-11 px-3 text-sm bg-white border border-moss/30 rounded-lg focus:border-forest focus:outline-none tabular-nums"
            />
          </div>

          {/* Commission Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-mist">
                Commission ({chargeMode === 'add' ? 'Added' : 'Deducted'})
              </label>
              <div className="flex bg-cream rounded-md p-0.5 border border-moss/20 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onChange({ commissionType: 'percent' })}
                  className={`px-2 py-0.5 rounded ${extras.commissionType === 'percent' ? 'bg-forest text-white' : 'text-mist'}`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ commissionType: 'fixed' })}
                  className={`px-2 py-0.5 rounded ${extras.commissionType === 'fixed' ? 'bg-forest text-white' : 'text-mist'}`}
                >
                  Rs.
                </button>
              </div>
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder={extras.commissionType === 'percent' ? 'e.g. 2 for 2%' : 'e.g. 500'}
              value={extras.commissionValStr}
              onChange={(e) => onChange({ commissionValStr: e.target.value })}
              className="w-full h-11 px-3 text-sm bg-white border border-moss/30 rounded-lg focus:border-forest focus:outline-none tabular-nums"
            />
          </div>

          {/* Labour Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-mist">
                Labour / Mazdoori ({chargeMode === 'add' ? 'Added' : 'Deducted'})
              </label>
              <div className="flex bg-cream rounded-md p-0.5 border border-moss/20 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onChange({ labourType: 'perBag' })}
                  className={`px-2 py-0.5 rounded ${extras.labourType === 'perBag' ? 'bg-forest text-white' : 'text-mist'}`}
                >
                  Per Bag
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ labourType: 'fixed' })}
                  className={`px-2 py-0.5 rounded ${extras.labourType === 'fixed' ? 'bg-forest text-white' : 'text-mist'}`}
                >
                  Total Rs.
                </button>
              </div>
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder={extras.labourType === 'perBag' ? 'Rs. per bag (e.g. 10)' : 'Total Rs. (e.g. 50)'}
              value={extras.labourValStr}
              onChange={(e) => onChange({ labourValStr: e.target.value })}
              className="w-full h-11 px-3 text-sm bg-white border border-moss/30 rounded-lg focus:border-forest focus:outline-none tabular-nums"
            />
          </div>

          {/* Seller / Buyer Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-mist mb-1">
                Seller (Optional)
              </label>
              <input
                type="text"
                maxLength={120}
                placeholder="Seller name"
                value={extras.seller}
                onChange={(e) => onChange({ seller: e.target.value })}
                className="w-full h-11 px-3 text-sm bg-white border border-moss/30 rounded-lg focus:border-forest focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-mist mb-1">
                Buyer (Optional)
              </label>
              <input
                type="text"
                maxLength={120}
                placeholder="Buyer name"
                value={extras.buyer}
                onChange={(e) => onChange({ buyer: e.target.value })}
                className="w-full h-11 px-3 text-sm bg-white border border-moss/30 rounded-lg focus:border-forest focus:outline-none"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-mist mb-1">
              Note / Remarks (Optional)
            </label>
            <input
              type="text"
              maxLength={500}
              placeholder="e.g. Lot #12, Wheat Grade A"
              value={extras.note}
              onChange={(e) => onChange({ note: e.target.value })}
              className="w-full h-11 px-3 text-sm bg-white border border-moss/30 rounded-lg focus:border-forest focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
