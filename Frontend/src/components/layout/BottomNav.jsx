import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function BottomNav({ onOpenQuickAdd }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Activity', path: '/transaction', icon: ReceiptText },
    // Center Quick Add button handled separately
    { label: 'Budgets', path: '/budgets', icon: PieChart },
    { label: 'Analytics', path: '/reports', icon: BarChart3 },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-slate-800/80 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around px-2 pt-2 h-16 max-w-lg mx-auto">
        {/* First 2 items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center min-h-[44px] min-w-[56px] px-2 py-1 rounded-xl transition-all duration-200 active:scale-95 touch-target',
                isActive
                  ? 'text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Center Quick Add Floating Action Button */}
        <div className="relative -top-3 flex flex-col items-center">
          <button
            onClick={onOpenQuickAdd}
            className="w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 text-white shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 active:scale-90 transition-all duration-200 flex items-center justify-center touch-target"
            aria-label="Quick Add Transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] text-slate-400 mt-1 font-medium">Add</span>
        </div>

        {/* Last 2 items */}
        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center min-h-[44px] min-w-[56px] px-2 py-1 rounded-xl transition-all duration-200 active:scale-95 touch-target',
                isActive
                  ? 'text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
