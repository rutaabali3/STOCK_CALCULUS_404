import React from 'react';

export type Md3CardVariant = 'elevated' | 'filled' | 'outlined';

export interface Md3CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Md3CardVariant;
  rounded?: '2xl' | '3xl';
}

export const Md3Card: React.FC<Md3CardProps> = ({
  variant = 'elevated',
  rounded = '2xl',
  className = '',
  children,
  ...props
}) => {
  const roundedClass = rounded === '3xl' ? 'rounded-3xl' : 'rounded-2xl';

  const variantClasses = {
    elevated:
      'bg-md-surface-container-low text-md-on-surface shadow-md-1 hover:shadow-md-2 transition-shadow duration-200',
    filled:
      'bg-md-surface-container text-md-on-surface',
    outlined:
      'bg-md-surface text-md-on-surface border border-md-outline-variant',
  }[variant];

  return (
    <div
      className={`overflow-hidden transition-colors duration-200 ${roundedClass} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
