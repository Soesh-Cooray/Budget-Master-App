import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl bg-slate-950/60 dark:bg-slate-950/70 border border-slate-700/80 dark:border-white/10 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 mt-1 pl-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
