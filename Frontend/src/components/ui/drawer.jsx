import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer / Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className={cn(
              'relative z-10 w-full max-h-[90vh] md:max-w-lg md:rounded-2xl rounded-t-3xl bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100',
              'pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-6',
              className
            )}
          >
            {/* Mobile Drag Pill Handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <div>
                {title && (
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                )}
                {description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors touch-target flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
