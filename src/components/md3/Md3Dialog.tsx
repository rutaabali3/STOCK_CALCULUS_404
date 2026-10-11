import React, { useEffect } from 'react';

export interface Md3DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export const Md3Dialog: React.FC<Md3DialogProps> = ({
  open,
  onClose,
  title,
  icon,
  children,
  actions,
  maxWidth = 'sm',
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog Surface Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthClass} bg-md-surface-container-high text-md-on-surface rounded-3xl p-6 shadow-md-4 border border-md-outline-variant/30 z-10 space-y-4 animate-scale-up`}
      >
        {icon && (
          <div className="w-10 h-10 rounded-full bg-md-secondary-container text-md-on-secondary-container flex items-center justify-center mx-auto mb-2">
            {icon}
          </div>
        )}

        <div className="space-y-2 text-center sm:text-start">
          <h2 className="text-xl font-bold tracking-tight text-md-on-surface">
            {title}
          </h2>
          <div className="text-sm text-md-on-surface-variant leading-relaxed">
            {children}
          </div>
        </div>

        {actions && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-md-outline-variant/20">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
