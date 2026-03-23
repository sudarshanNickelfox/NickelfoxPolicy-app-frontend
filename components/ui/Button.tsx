'use client';

import { cn } from '@/lib/utils/cn';
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(135deg,#2F5BE7_0%,#4070f0_100%)] hover:bg-[linear-gradient(135deg,#2650d4_0%,#3560dd_100%)] text-white shadow-[0_4px_16px_rgba(47,91,231,0.35)] focus-visible:ring-[#2F5BE7]',
  secondary:
    'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-indigo-500',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-indigo-500',
  danger:
    'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

// Variants that get a hover scale effect
const HOVER_SCALE_VARIANTS: ButtonVariant[] = ['primary', 'danger'];

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    className,
    disabled,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || isLoading;
  const hasHoverScale = HOVER_SCALE_VARIANTS.includes(variant);

  return (
    <motion.button
      ref={ref}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      whileHover={!isDisabled && hasHoverScale ? { scale: 1.01 } : undefined}
      transition={{ duration: 0.15 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...(rest as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {isLoading && (
        <svg
          aria-hidden="true"
          className="h-4 w-4 animate-spin"
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
});
