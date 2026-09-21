import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Menu,
  X,
  Target,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { currencyList } from '../../api';

export function Header({ title, subtitle, userName }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'USD');

  const handleCurrencyChange = (e) => {
    const val = e.target.value;
    setCurrency(val);
    localStorage.setItem('currency', val);
    window.dispatchEvent(new Event('currencyChange'));
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/signin');
  };

  const secondaryNav = [
    { label: 'Savings Goals', path: '/savings-goals', icon: Target },
    { label: 'Debts', path: '/debts', icon: CreditCard },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'FAQ & Help', path: '/faq', icon: HelpCircle },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 w-full glass-panel border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-all">
        {/* Left Side: Brand (on mobile) or Greeting (on desktop) */}
        <div className="flex items-center gap-3">
          {/* Mobile brand indicator */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white leading-tight">BudgetMaster</h1>
              <p className="text-[10px] text-slate-400 leading-tight">Personal Finance</p>
            </div>
          </div>

          {/* Desktop Title & Subtitle */}
          <div className="hidden md:block">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {title || 'Financial Overview'}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Sparkles className="w-3 h-3" /> Live
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle || (userName ? `Welcome back, ${userName}` : 'Manage and optimize your money')}
            </p>
          </div>
        </div>

        {/* Right Side: Currency, Theme Toggle, Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Currency Selector */}
          <div className="flex items-center">
            <select
              value={currency}
              onChange={handleCurrencyChange}
              className="h-9 px-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {currencyList.slice(0, 15).map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.code} ({cur.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Mobile Auxiliary Menu Drawer Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors touch-target flex items-center justify-center"
            aria-label="More navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer for auxiliary pages (Savings Goals, Debts, Settings, FAQ) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 pb-8 space-y-2 shadow-2xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto mb-3" />
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-semibold text-sm text-slate-200">Additional Features</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors min-h-[44px]"
                >
                  <Icon className="w-5 h-5 text-indigo-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/30 transition-colors min-h-[44px]"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
