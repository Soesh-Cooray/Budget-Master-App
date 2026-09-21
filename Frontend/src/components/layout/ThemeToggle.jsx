import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle({ className }) {
  const { isDark, toggleColorMode } = useTheme();

  return (
    <button
      onClick={toggleColorMode}
      className={`relative p-2 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition-all duration-300 active:scale-95 touch-target flex items-center justify-center ${className || ''}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-400 transition-transform duration-300 rotate-0 hover:-rotate-12" />
        )}
      </div>
    </button>
  );
}

export default ThemeToggle;
