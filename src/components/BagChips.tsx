import React from 'react';
import { formatDecimal } from 'shared/decimal';
import { X, Undo2 } from 'lucide-react';

interface BagChipsProps {
  weightsG: number[];
  onRemoveIndex: (index: number) => void;
  onUndoLast: () => void;
  canUndo: boolean;
}

export const BagChips: React.FC<BagChipsProps> = ({
  weightsG,
  onRemoveIndex,
  onUndoLast,
  canUndo,
}) => {
  if (weightsG.length === 0) {
    return (
      <div className="py-6 px-4 text-center border-2 border-dashed border-mist/30 rounded-xl bg-white/40">
        <p className="text-sm font-medium text-mist">
          No bags added yet. Type a weight and press <span className="font-bold text-forest">Add</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-mist">
          Bags ({weightsG.length})
        </span>

        {canUndo && (
          <button
            type="button"
            onClick={onUndoLast}
            className="flex items-center gap-1 text-xs font-semibold text-moss hover:text-forest transition-colors py-1 px-2 rounded-md hover:bg-moss/10"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo Last</span>
          </button>
        )}
      </div>

      <div className="max-h-44 overflow-y-auto p-2 bg-white rounded-xl border border-moss/20 shadow-inner flex flex-wrap gap-1.5 content-start">
        {weightsG.map((grams, idx) => (
          <div
            key={`${idx}-${grams}`}
            className="group inline-flex items-center gap-1.5 bg-cream/70 border border-moss/30 hover:border-moss rounded-lg px-2.5 py-1 text-sm font-semibold text-ink transition-all shadow-sm"
          >
            <span className="text-xs text-mist font-normal">#{idx + 1}</span>
            <span className="tabular-nums">{formatDecimal(grams, 3)}</span>
            <span className="text-[11px] text-mist">kg</span>

            <button
              type="button"
              onClick={() => onRemoveIndex(idx)}
              aria-label={`Remove bag ${idx + 1}`}
              className="p-0.5 -mr-1 rounded-full text-mist hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
