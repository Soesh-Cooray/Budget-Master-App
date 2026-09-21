import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names safely
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency amount with commas and 2 decimals
 */
export function formatCurrency(amount, symbol = '$') {
  const numericAmount = Number(amount) || 0;
  return `${symbol}${numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a number cleanly without symbol
 */
export function formatNumber(amount) {
  const numericAmount = Number(amount) || 0;
  return numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Greeting based on current time
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Get category color badge style
 */
export function getCategoryBadgeStyle(categoryName = '') {
  const hash = String(categoryName).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palettes = [
    { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-400' },
    { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400' },
    { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
    { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20', dot: 'bg-sky-400' },
    { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400' },
  ];
  return palettes[hash % palettes.length];
}
