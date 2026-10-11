import React from 'react';
import { formatDecimal } from 'shared/decimal';
import { X, Undo2, ShoppingBag } from 'lucide-react';

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
      <div className="py-8 px-4 text-center border-2 border-dashed border-md-outline-variant/50 rounded-3xl bg-md-surface-container-low flex flex-col items-center justify-center gap-2">
        <div className="w-10 h-10 rounded-full bg-md-surface-container-high flex items-center justify-center text-md-on-surface-variant">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-md-on-surface-variant">
          No bags added yet. Type a weight and tap <span className="font-bold text-md-primary">Add</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant">
            Bags Stream
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-md-secondary-container text-md-on-secondary-container">
            {weightsG.length}
          </span>
        </div>

        {canUndo && (
          <button
            type="button"
            onClick={onUndoLast}
            className="flex items-center gap-1.5 text-xs font-bold text-md-primary hover:bg-md-primary/10 transition-colors py-1 px-3 rounded-full"
          >
            <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Undo Last</span>
          </button>
        )}
      </div>

      <div className="max-h-52 md:max-h-64 overflow-y-auto p-3 bg-md-surface-container-low rounded-2xl border border-md-outline-variant/30 shadow-inner flex flex-wrap gap-2 content-start">
        {weightsG.map((grams, idx) => (
          <div
            key={`${idx}-${grams}`}
            className="group inline-flex items-center gap-2 bg-md-surface-container-highest border border-md-outline-variant/40 hover:border-md-outline rounded-xl px-3 py-1.5 text-sm font-semibold text-md-on-surface transition-all shadow-xs"
          >
            <span className="text-xs text-md-on-surface-variant/80 font-normal">#{idx + 1}</span>
            <span className="tabular-nums font-bold">{formatDecimal(grams, 3)}</span>
            <span className="text-[11px] text-md-on-surface-variant">kg</span>

            <button
              type="button"
              onClick={() => onRemoveIndex(idx)}
              aria-label={`Remove bag ${idx + 1}`}
              className="p-0.5 -mr-1 rounded-full text-md-on-surface-variant hover:text-md-error hover:bg-md-error/15 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
