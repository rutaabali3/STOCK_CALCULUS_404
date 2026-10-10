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
    // Keep focus on input for fast mobile weighing
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
    // e.g. "55" -> 55000, "50.5" -> 50500, "49.75" -> 49750
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
    <div className="w-full">
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
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
            className="w-full h-14 px-4 text-2xl font-bold bg-white text-ink border-2 border-moss/40 rounded-xl focus:border-forest focus:outline-none transition-colors shadow-sm placeholder:text-mist/50 tabular-nums"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-mist pointer-events-none">
            kg
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          aria-label="Add bag weight"
          className="h-14 px-6 bg-wheat hover:bg-wheat/90 active:scale-[0.98] text-forest font-bold text-lg rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0 disabled:opacity-50"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};
