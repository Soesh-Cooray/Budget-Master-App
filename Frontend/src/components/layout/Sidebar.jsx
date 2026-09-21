import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Target,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCurrency } from '../../context/CurrencyContext';

export function Sidebar({ open, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currency, setCurrency, currencyList } = useCurrency();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', path: '/transaction', icon: ReceiptText },
    { label: 'Budgets', path: '/budgets', icon: PieChart },
    { label: 'Savings Goals', path: '/savings-goals', icon: Target },
    { label: 'Debts', path: '/debts', icon: CreditCard },
    { label: 'Analytics', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'FAQ', path: '/faq', icon: HelpCircle },
  ];

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  const handleLogout = () => {
    const savedCurrency = localStorage.getItem('currency');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (savedCurrency) {
      localStorage.setItem('currency', savedCurrency);
    }
    navigate('/signin');
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-30 transition-all duration-300 ease-in-out',
        'glass-panel border-r border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-950/80 text-slate-800 dark:text-slate-200',
        open ? 'w-64' : 'w-20'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/90 dark:border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">BudgetMaster</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">Pro Edition</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none group',
                isActive
                  ? 'bg-indigo-600/10 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
              )}
              title={!open ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-transform group-hover:scale-110',
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                )}
              />
              {open && <span className="truncate">{item.label}</span>}
              {open && isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 ml-auto" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Currency & Logout */}
      <div className="p-3 border-t border-slate-200/90 dark:border-slate-800/80 space-y-3">
        {open ? (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Base Currency
            </label>
            <select
              value={currency}
              onChange={handleCurrencyChange}
              className="w-full h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 px-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {currencyList.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.code} ({cur.symbol}) — {cur.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 dark:hover:bg-rose-950/30 transition-colors',
            !open && 'justify-center'
          )}
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {open && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
