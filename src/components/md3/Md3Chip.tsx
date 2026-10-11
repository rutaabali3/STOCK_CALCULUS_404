import React from 'react';
import { X } from 'lucide-react';

export interface Md3ChipProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  selected?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
  removeAriaLabel?: string;
}

export const Md3Chip: React.FC<Md3ChipProps> = ({
  label,
  icon,
  selected = false,
  onRemove,
  onClick,
  className = '',
  removeAriaLabel = 'Remove',
}) => {
  const isInteractive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all select-none border ${
        selected
          ? 'bg-md-secondary-container text-md-on-secondary-container border-transparent shadow-sm'
          : 'bg-md-surface-container-low text-md-on-surface border-md-outline-variant/60 hover:bg-md-surface-container'
      } ${isInteractive ? 'cursor-pointer active:scale-95' : ''} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={removeAriaLabel}
          className="p-0.5 -mr-1 rounded-full text-md-on-surface-variant hover:text-md-error hover:bg-md-error/10 transition-colors focus:outline-none"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
