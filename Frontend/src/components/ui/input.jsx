import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(
  ({ className, type = 'text', error, ...props }, ref) => {
    const isDate = type === 'date';
    const inputRef = React.useRef(null);

    const setRefs = React.useCallback(
      (node) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const handleClick = (e) => {
      if (isDate) {
        try {
          inputRef.current?.showPicker?.();
        } catch (_) {}
      }
      if (props.onClick) {
        props.onClick(e);
      }
    };

    return (
      <div className="w-full">
        <div className="relative flex items-center w-full group">
          <input
            type={type}
            ref={setRefs}
            onClick={handleClick}
            className={cn(
              'flex h-11 w-full rounded-xl bg-white dark:bg-slate-950/70 border border-slate-300 dark:border-white/10 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
              isDate && 'custom-date-input pr-10 cursor-pointer',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
              className
            )}
            {...props}
          />
          {isDate && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"
              aria-hidden="true"
            >
              <Calendar className="w-4 h-4" />
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-400 mt-1 pl-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

