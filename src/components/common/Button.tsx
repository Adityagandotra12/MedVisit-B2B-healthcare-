import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button ${variant === 'secondary' ? 'secondary' : ''} ${className ?? ''}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
