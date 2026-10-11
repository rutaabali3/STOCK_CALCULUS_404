import React from 'react';
import { Check } from 'lucide-react';

export interface Md3SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

export const Md3Switch: React.FC<Md3SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  ariaLabel,
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-13 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary/50 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked
          ? 'bg-md-primary border-md-primary'
          : 'bg-md-surface-container-highest border-md-outline'
      }`}
    >
      <span
        className={`pointer-events-none inline-flex items-center justify-center rounded-full shadow-sm ring-0 transition-all duration-200 ease-in-out ${
          checked
            ? 'h-6 w-6 translate-x-6 bg-md-on-primary text-md-primary'
            : 'h-4 w-4 translate-x-1.5 bg-md-outline text-transparent'
        }`}
      >
        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </span>
    </button>
  );
};
