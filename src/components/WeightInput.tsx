import React, { useRef, useState, useEffect } from 'react';
import { parseDecimal } from 'shared/decimal';
import { Plus } from 'lucide-react';

interface WeightInputProps {
  onAddWeight: (grams: number) => void;
  disabled?: boolean;
}

export const WeightInput: React.FC<WeightInputProps> = ({ onAddWeight, disabled }) => {
  const [val, setVal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAddRef = useRef<{ time: number; val: string }>({ time: 0, val: '' });

  useEffect(() => {
    // Keep focus on input for fast mobile & keyboard weighing
    inputRef.current?.focus();
  }, []);

  const handleAdd = () => {
    if (!val.trim()) {
      inputRef.current?.focus();
      return;
    }

    const now = Date.now();
    // Guard against double-tap adding the same weight twice within 300 ms only if value unchanged
    if (now - lastAddRef.current.time < 300 && lastAddRef.current.val === val.trim()) {
      return;
    }

    // Weight is entered in kg, parsed with up to 3 decimal places -> grams
    const grams = parseDecimal(val, 3);

    if (grams === null || grams <= 0) {
      setError('Enter a valid weight in kg');
      inputRef.current?.focus();
      return;
    }

    lastAddRef.current = { time: now, val: val.trim() };
    onAddWeight(grams);
    setVal('');
    setError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-stretch gap-2.5">
        <div
          className={`relative flex-1 bg-md-surface-container-lowest border-2 rounded-2xl transition-all duration-200 shadow-sm ${
            error
              ? 'border-md-error'
              : 'border-md-outline-variant focus-within:border-md-primary focus-within:ring-2 focus-within:ring-md-primary/20'
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={val}
            disabled={disabled}
            onChange={(e) => {
              setVal(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Bag weight in kilograms"
            className="w-full h-14 pl-4 pr-12 text-2xl font-black bg-transparent text-md-on-surface placeholder:text-md-on-surface-variant/40 focus:outline-none tabular-nums"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-md-on-surface-variant pointer-events-none select-none">
            kg
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          aria-label="Add bag weight"
          className="h-14 px-6 md:px-8 bg-md-primary hover:bg-md-primary/90 active:scale-[0.98] text-md-on-primary font-bold text-base rounded-full flex items-center justify-center gap-2 shadow-md-2 hover:shadow-md-3 transition-all shrink-0 disabled:opacity-40 select-none cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </div>

      {error && (
        <p className="text-xs text-md-error font-medium px-2 animate-fade-in">{error}</p>
      )}
    </div>
  );
};
