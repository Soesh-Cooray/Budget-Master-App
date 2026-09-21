import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-slate-800/80 text-slate-200 border-slate-700/60',
    income: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    expense: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    savings: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    outline: 'border-slate-700 text-slate-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
