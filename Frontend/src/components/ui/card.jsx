import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-slate-200/90 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-xl dark:shadow-black/20 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('p-5 sm:p-6 pb-2', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-xs text-slate-500 dark:text-slate-400 mt-0.5', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-5 sm:p-6 pt-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('p-5 sm:p-6 pt-0 flex items-center', className)} {...props}>
      {children}
    </div>
  );
}
