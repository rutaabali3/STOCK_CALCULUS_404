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
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-md-on-surface-variant">
            {label}
          </label>
        )}

        <div
          className={`relative flex items-center transition-all duration-200 ${
            variant === 'outlined'
              ? `bg-md-surface-container-lowest border-2 rounded-2xl ${
                  error
                    ? 'border-md-error'
                    : 'border-md-outline-variant focus-within:border-md-primary'
                }`
              : `bg-md-surface-container-high rounded-xl border-b-2 ${
                  error
                    ? 'border-md-error'
                    : 'border-md-outline focus-within:border-md-primary'
                }`
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {leadingIcon && (
            <span className="pl-4 text-md-on-surface-variant shrink-0">
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={`w-full bg-transparent text-md-on-surface placeholder:text-md-on-surface-variant/50 focus:outline-none transition-colors tabular-nums ${
              leadingIcon ? 'pl-2' : 'pl-4'
            } ${trailingIcon || suffix ? 'pr-2' : 'pr-4'} ${className}`}
            {...props}
          />

          {suffix && (
            <span className="pr-4 text-xs font-bold text-md-on-surface-variant shrink-0 select-none">
              {suffix}
            </span>
          )}

          {trailingIcon && (
            <span className="pr-4 text-md-on-surface-variant shrink-0">
              {trailingIcon}
            </span>
          )}
        </div>

        {error ? (
          <p className="text-xs text-md-error font-medium px-1 animate-fade-in">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-md-on-surface-variant px-1 font-normal">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Md3TextField.displayName = 'Md3TextField';
