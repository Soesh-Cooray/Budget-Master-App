import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

export function NotificationBanner() {
  const [troubleMessage, setTroubleMessage] = useState(null);

  useEffect(() => {
    const handleTrouble = (event) => {
      setTroubleMessage(
        event.detail || 'The backend is experiencing trouble. Please try again.'
      );
    };

    window.addEventListener('backend-trouble', handleTrouble);
    return () => window.removeEventListener('backend-trouble', handleTrouble);
  }, []);

  return (
    <AnimatePresence>
      {troubleMessage && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-[9999] pointer-events-auto"
        >
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-200 backdrop-blur-xl shadow-2xl shadow-rose-950/50">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="flex-1 text-xs sm:text-sm font-medium">
              {troubleMessage}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/50 transition-colors"
              title="Reload"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTroubleMessage(null)}
              className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/50 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
