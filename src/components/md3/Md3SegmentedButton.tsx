import React from 'react';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface Md3SegmentedButtonProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function Md3SegmentedButton<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: Md3SegmentedButtonProps<T>) {
  const sizeClasses = size === 'sm' ? 'h-8 text-xs px-2.5' : 'h-10 text-sm px-4';

  return (
    <div
      className={`inline-flex items-center bg-md-surface-container-low border border-md-outline-variant/60 rounded-full p-1 select-none ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all duration-200 ${sizeClasses} ${
              isSelected
                ? 'bg-md-secondary-container text-md-on-secondary-container shadow-sm'
                : 'text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
