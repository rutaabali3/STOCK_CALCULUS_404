import React from 'react';

export type Md3ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
export type Md3ButtonSize = 'sm' | 'md' | 'lg';

export interface Md3ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Md3ButtonVariant;
  size?: Md3ButtonSize;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
}

export const Md3Button: React.FC<Md3ButtonProps> = ({
  variant = 'filled',
  size = 'md',
  icon,
  trailingIcon,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeClasses = {
    sm: 'h-9 px-4 text-xs gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-13 px-6 text-base font-bold gap-2.5',
  }[size];

  const variantClasses = {
    filled:
      'bg-md-primary text-md-on-primary shadow-md-1 hover:shadow-md-2 hover:bg-md-primary/95',
    tonal:
      'bg-md-secondary-container text-md-on-secondary-container hover:bg-md-secondary-container/90',
    outlined:
      'bg-transparent border border-md-outline text-md-primary hover:bg-md-primary/[0.08]',
    text:
      'bg-transparent text-md-primary hover:bg-md-primary/[0.08] px-3',
    elevated:
      'bg-md-surface-container-low text-md-primary shadow-md-1 hover:shadow-md-2 hover:bg-md-surface-container',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {!loading && trailingIcon && <span className="shrink-0">{trailingIcon}</span>}
    </button>
  );
};
