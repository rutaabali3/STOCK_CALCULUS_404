import React from 'react';

export interface Md3TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  suffix?: string;
  error?: string | null;
  helperText?: string;
  variant?: 'outlined' | 'filled';
  containerClassName?: string;
}

export const Md3TextField = React.forwardRef<HTMLInputElement, Md3TextFieldProps>(
  (
    {
      label,
      leadingIcon,
      trailingIcon,
      suffix,
      error,
      helperText,
      variant = 'outlined',
      className = '',
      containerClassName = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        {label && (
          <label className="block text-xs font-semibold tracking-wide text-md-on-surface-variant ml-1">
            {label}
          </label>
        )}

        <div
          className={`relative flex items-center h-12 sm:h-14 transition-all duration-200 ${
            variant === 'outlined'
              ? `bg-md-surface-container-lowest border rounded-2xl ${
                  error
                    ? 'border-2 border-md-error ring-2 ring-md-error/15'
                    : 'border-md-outline/40 hover:border-md-outline focus-within:border-2 focus-within:border-md-primary focus-within:ring-4 focus-within:ring-md-primary/10'
                }`
              : `bg-md-surface-container-high rounded-xl border-b-2 ${
                  error
                    ? 'border-md-error ring-2 ring-md-error/15'
                    : 'border-md-outline/60 focus-within:border-md-primary focus-within:ring-2 focus-within:ring-md-primary/15'
                }`
          } ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
        >
          {leadingIcon && (
            <span className="pl-4 text-md-on-surface-variant flex items-center justify-center shrink-0">
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={`w-full h-full bg-transparent text-base font-semibold text-md-on-surface placeholder:text-md-on-surface-variant/40 focus:outline-none transition-colors tabular-nums ${
              leadingIcon ? 'pl-2.5' : 'pl-4'
            } ${trailingIcon || suffix ? 'pr-2' : 'pr-4'} ${className}`}
            {...props}
          />

          {suffix && (
            <span className="pr-4 text-sm font-bold text-md-on-surface-variant shrink-0 select-none pointer-events-none">
              {suffix}
            </span>
          )}

          {trailingIcon && (
            <span className="pr-4 text-md-on-surface-variant flex items-center justify-center shrink-0">
              {trailingIcon}
            </span>
          )}
        </div>

        {error ? (
          <p className="text-xs text-md-error font-medium px-2 animate-fade-in">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-md-on-surface-variant px-2 font-normal">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Md3TextField.displayName = 'Md3TextField';
