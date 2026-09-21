import React from 'react';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 min-h-[44px]';

    const variants = {
      default:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 dark:shadow-indigo-900/30',
      secondary:
        'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80',
      outline:
        'border border-slate-700 hover:bg-slate-800/60 text-slate-200 dark:border-slate-800 dark:hover:bg-slate-900/80',
      ghost:
        'hover:bg-slate-800/50 text-slate-300 hover:text-slate-100',
      destructive:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25',
      income:
        'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25',
      expense:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25',
      glass:
        'glass-panel hover:bg-white/10 text-slate-100 shadow-sm',
    };

    const sizes = {
      default: 'h-11 px-4 py-2 rounded-xl text-sm',
      sm: 'h-9 px-3 rounded-lg text-xs',
      lg: 'h-12 px-6 rounded-2xl text-base',
      icon: 'h-11 w-11 rounded-xl p-0',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
