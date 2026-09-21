import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowRight,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Sparkles,
  PiggyBank,
  CheckCircle2,
} from 'lucide-react';
import { ThemeToggle } from './layout/ThemeToggle';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-300 flex flex-col font-sans transition-colors duration-300 overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors duration-300">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 transition-transform group-hover:scale-105">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
              BudgetMaster
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase block leading-tight">
              Personal Finance
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/signin"
            className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            Sign In
          </Link>
          <Link to="/signup">
            <Button size="sm" className="rounded-xl font-bold px-4 shadow-md shadow-indigo-600/30">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Personal Budget Management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Take Control Of <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-600 dark:from-indigo-400 dark:via-sky-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Your Finances
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Track expenses with precision, set proactive category budgets, and achieve your financial goals with BudgetMaster's mobile-first Progressive Web App.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30">
                  <span>Start Free Today</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/signin" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-2xl font-semibold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
                >
                  Sign In to Account
                </Button>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Subscription Fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Mobile PWA & Desktop Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Real-Time Cashflow Insights</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Live Interactive Card Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Ambient Glow behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 dark:from-indigo-500/30 dark:to-emerald-500/30 rounded-3xl blur-2xl opacity-70 animate-pulse" />

              <Card className="relative z-10 p-6 sm:p-7 space-y-5 border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/90 shadow-2xl shadow-slate-300/40 dark:shadow-black/60 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Budget Allocation
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Monthly Targets & Spend Rate</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                    On Track
                  </span>
                </div>

                {/* Progress bars */}
                <div className="space-y-4">
                  {/* Housing / Rent */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">Housing & Utilities</span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">$1,450 / $1,800</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800 p-0.5">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 w-[80%]" />
                    </div>
                  </div>

                  {/* Groceries & Food */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">Groceries & Dining</span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">$480 / $700</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800 p-0.5">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 w-[68%]" />
                    </div>
                  </div>

                  {/* Leisure & Travel */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">Leisure & Travel</span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">$290 / $350</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800 p-0.5">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 w-[82%]" />
                    </div>
                  </div>
                </div>

                {/* Savings Goal Card Highlight */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25 flex items-center justify-center">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">Emergency Reserve</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Target reached: 85%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block">
                      $12,000.00
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saved</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Feature Highlights Section */}
        <section className="mt-20 sm:mt-28 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why Choose BudgetMaster?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              Built specifically for modern budgeting needs with responsive mobile convenience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <Card className="hover:border-indigo-400/50 dark:hover:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 hover:shadow-lg dark:hover:shadow-black/40 transition-all p-6 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Expense Tracking</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Categorize income and spending in real time. Filter across date ranges, payment channels, and transaction types effortlessly.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:border-indigo-400/50 dark:hover:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 hover:shadow-lg dark:hover:shadow-black/40 transition-all p-6 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Budget Health</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Set monthly allocation limits by category. Visual progress bars dynamically shift from emerald to warning colors before you overspend.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:border-indigo-400/50 dark:hover:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 hover:shadow-lg dark:hover:shadow-black/40 transition-all p-6 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Financial Reports</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Gain deep clarity into your net worth and liquidity over time through interactive cashflow charts and category breakdowns.
              </p>
            </Card>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 py-8 px-4 text-center mt-16 space-y-2 transition-colors duration-300">
        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-600/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-transparent flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">BudgetMaster</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} BudgetMaster. All rights reserved.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Developed by Soesh Cooray
        </p>
      </footer>
    </div>
  );
}

export default HomePage;