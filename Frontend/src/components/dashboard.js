import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  Plus,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  transactionAPI,
  budgetAPI,
  categoryAPI,
  apiClient,
  API_BASE,
} from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { StatCard } from './dashboard/StatCard';
import { IncomeVsExpenseChart } from './dashboard/IncomeVsExpenseChart';
import { ExpenseDonutChart } from './dashboard/ExpenseDonutChart';
import { BudgetProgressList } from './dashboard/BudgetProgressList';
import { RecentTransactions } from './dashboard/RecentTransactions';
import { TransactionDrawer } from './transactions/TransactionDrawer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatCurrency, getGreeting, cn } from '../lib/utils';
import {
  getUserPreferences,
  saveUserPreferences,
  syncUserPreferencesFromBackend,
} from '../services/userPreferences';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currencySymbol } = useCurrency();
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Active Preset state with user preference persistence
  const [activePreset, setActivePreset] = useState(() => {
    const prefs = getUserPreferences();
    return prefs?.dashboard_preset || '30days';
  });

  const parseDatePreference = (dateVal, fallback) => {
    if (!dateVal) return fallback;
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const [y, m, d] = dateVal.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? fallback : parsed;
  };

  // Date filters with user-scoped preferences and localStorage persistence
  const [startDate, setStartDate] = useState(() => {
    const prefs = getUserPreferences();
    if (prefs?.dashboard_start_date) {
      return parseDatePreference(prefs.dashboard_start_date, subDays(new Date(), 30));
    }
    const saved = localStorage.getItem('dashboardStartDate');
    return saved ? parseDatePreference(saved, subDays(new Date(), 30)) : subDays(new Date(), 30);
  });

  const [endDate, setEndDate] = useState(() => {
    const prefs = getUserPreferences();
    if (prefs?.dashboard_end_date) {
      return parseDatePreference(prefs.dashboard_end_date, new Date());
    }
    const saved = localStorage.getItem('dashboardEndDate');
    return saved ? parseDatePreference(saved, new Date()) : new Date();
  });

  // Sync user preferences on mount and on cross-component updates
  useEffect(() => {
    syncUserPreferencesFromBackend().then((prefs) => {
      if (prefs) {
        if (prefs.dashboard_preset) setActivePreset(prefs.dashboard_preset);
        if (prefs.dashboard_start_date) {
          setStartDate(parseDatePreference(prefs.dashboard_start_date, subDays(new Date(), 30)));
        }
        if (prefs.dashboard_end_date) {
          setEndDate(parseDatePreference(prefs.dashboard_end_date, new Date()));
        }
      }
    });

    const handlePrefUpdate = (e) => {
      const p = e.detail?.preferences;
      if (p) {
        if (p.dashboard_preset) setActivePreset(p.dashboard_preset);
        if (p.dashboard_start_date) {
          setStartDate(parseDatePreference(p.dashboard_start_date, subDays(new Date(), 30)));
        }
        if (p.dashboard_end_date) {
          setEndDate(parseDatePreference(p.dashboard_end_date, new Date()));
        }
      }
    };
    window.addEventListener('user-preferences-updated', handlePrefUpdate);
    return () => window.removeEventListener('user-preferences-updated', handlePrefUpdate);
  }, []);

  const handleStartDateChange = (newDate, preset = '') => {
    if (!newDate || isNaN(newDate.getTime())) return;
    setStartDate(newDate);
    if (preset !== undefined) setActivePreset(preset);
    const dateStr = format(newDate, 'yyyy-MM-dd');
    localStorage.setItem('dashboardStartDate', dateStr);
    saveUserPreferences({
      dashboard_start_date: dateStr,
      ...(preset !== undefined ? { dashboard_preset: preset } : {}),
    });
  };

  const handleEndDateChange = (newDate, preset = '') => {
    if (!newDate || isNaN(newDate.getTime())) return;
    setEndDate(newDate);
    if (preset !== undefined) setActivePreset(preset);
    const dateStr = format(newDate, 'yyyy-MM-dd');
    localStorage.setItem('dashboardEndDate', dateStr);
    saveUserPreferences({
      dashboard_end_date: dateStr,
      ...(preset !== undefined ? { dashboard_preset: preset } : {}),
    });
  };

  // Financial Data state
  const [financialData, setFinancialData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    currentBalance: 0,
    cashflowSeries: [],
    expenseBreakdown: [],
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentBudgets, setRecentBudgets] = useState([]);
  const [categories, setCategories] = useState([]);

  // Fetch user profile info
  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get('/auth/users/me/', {
        baseURL: API_BASE,
      });
      setFirstName(response.data.first_name || '');
      setUsername(response.data.username || response.data.email || '');
    } catch (err) {
      setFirstName('');
      setUsername('');
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const formatDateForApi = (date) => format(date, 'yyyy-MM-dd');

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fmtStart = formatDateForApi(startDate);
      const fmtEnd = formatDateForApi(endDate);

      const [expensesRes, incomesRes, savingsRes, budgetsRes, categoriesRes] =
        await Promise.all([
          transactionAPI.getExpenses(fmtStart, fmtEnd),
          transactionAPI.getIncomes(fmtStart, fmtEnd),
          transactionAPI.getSavings(fmtStart, fmtEnd),
          budgetAPI.getAll(),
          categoryAPI.getAll(),
        ]);

      const expenses = expensesRes.data || [];
      const incomes = incomesRes.data || [];
      const savingsTxns = savingsRes.data || [];
      const budgets = budgetsRes.data || [];
      const allCategories = categoriesRes.data || [];

      setCategories(allCategories);

      // Calculations
      const totalIncome = incomes.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const totalSavings = savingsTxns.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const currentBalance = totalIncome - totalExpenses - totalSavings;

      // Group cashflow for Recharts Area chart
      const monthMap = {};
      const addPoints = (arr, key) => {
        arr.forEach((item) => {
          const m = format(new Date(item.date), 'MMM d');
          if (!monthMap[m]) {
            monthMap[m] = { name: m, income: 0, expense: 0 };
          }
          monthMap[m][key] += parseFloat(item.amount || 0);
        });
      };
      addPoints(incomes, 'income');
      addPoints(expenses, 'expense');

      const cashflowSeries = Object.values(monthMap);
      if (cashflowSeries.length === 0) {
        cashflowSeries.push({ name: 'Start', income: 0, expense: 0 });
        cashflowSeries.push({ name: 'Current', income: totalIncome, expense: totalExpenses });
      }

      // Group expenses by category for Donut chart
      const catTotals = {};
      expenses.forEach((exp) => {
        const cName = exp.category_name || 'General';
        catTotals[cName] = (catTotals[cName] || 0) + parseFloat(exp.amount || 0);
      });
      const expenseBreakdown = Object.entries(catTotals).map(([name, value]) => ({
        name,
        value,
      }));

      // Calculate spent for budgets
      const budgetsWithSpent = budgets.map((b) => {
        const bCatId = typeof b.category === 'object' ? b.category.id : b.category;
        const spent = expenses
          .filter((exp) => {
            const expCatId = typeof exp.category === 'object' ? exp.category.id : exp.category;
            return Number(expCatId) === Number(bCatId);
          })
          .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

        const categoryObj = allCategories.find((c) => c.id === bCatId);
        return {
          ...b,
          category_name: categoryObj ? categoryObj.name : 'Category',
          spent,
        };
      });

      // All transactions sorted
      const combined = [...expenses, ...incomes, ...savingsTxns].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setFinancialData({
        totalIncome,
        totalExpenses,
        totalSavings,
        currentBalance,
        cashflowSeries,
        expenseBreakdown,
      });

      setRecentTransactions(combined.slice(0, 5));
      setRecentBudgets(budgetsWithSpent);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Unable to load latest dashboard data. Please try again.');
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Date Range Quick Preset Handlers
  const setPresetRange = (type) => {
    const today = new Date();
    if (type === '30days') {
      const start = subDays(today, 30);
      handleStartDateChange(start, type);
      handleEndDateChange(today, type);
    } else if (type === 'thisMonth') {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      handleStartDateChange(start, type);
      handleEndDateChange(end, type);
    } else if (type === 'all') {
      const start = new Date(today.getFullYear(), 0, 1);
      handleStartDateChange(start, type);
      handleEndDateChange(today, type);
    }
  };

  const displayName = firstName || username || 'Friend';

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Top Welcome Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-white via-indigo-50/50 to-white dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Overview
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {getGreeting()},{' '}
            <span className="text-indigo-600 dark:text-indigo-400">{displayName}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's a breakdown of your current liquidity, burn rate, and spending targets.
          </p>
        </div>

        {/* Quick Add Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => setQuickAddOpen(true)}
            variant="default"
            className="rounded-xl font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Transaction</span>
          </Button>
        </div>
      </div>

      {/* Date Range Selector Card with From Date, To Date & Update Button */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-3 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Date Range Filter
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setPresetRange('30days')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activePreset === '30days'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              )}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setPresetRange('thisMonth')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activePreset === 'thisMonth'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              )}
            >
              This Month
            </button>
            <button
              onClick={() => setPresetRange('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activePreset === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              )}
            >
              Year to Date
            </button>
          </div>
        </div>

        {/* Date Inputs & Update Button Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-1">
          {/* From Date */}
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              From Date
            </label>
            <Input
              type="date"
              value={format(startDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  handleStartDateChange(parseDatePreference(e.target.value, new Date()), '');
                }
              }}
              className="h-11 text-xs sm:text-sm font-semibold"
            />
          </div>

          {/* To Date */}
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              To Date
            </label>
            <Input
              type="date"
              value={format(endDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  handleEndDateChange(parseDatePreference(e.target.value, new Date()), '');
                }
              }}
              className="h-11 text-xs sm:text-sm font-semibold"
            />
          </div>

          {/* Update Button */}
          <Button
            onClick={() => fetchData()}
            variant="default"
            className="h-11 px-6 rounded-xl font-bold shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 shrink-0 touch-target"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Update</span>
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Current Balance"
          value={formatCurrency(financialData.currentBalance, currencySymbol)}
          subtitle="Net available liquidity"
          icon={Wallet}
          type="default"
          trend="+12.4%"
          trendDirection={financialData.currentBalance >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Total Income"
          value={formatCurrency(financialData.totalIncome, currencySymbol)}
          subtitle="Revenue & deposits"
          icon={ArrowUpCircle}
          type="income"
          trend="+8.2%"
          trendDirection="up"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(financialData.totalExpenses, currencySymbol)}
          subtitle="Total outgoing outflow"
          icon={ArrowDownCircle}
          type="expense"
          trend="-3.5%"
          trendDirection="down"
        />
        <StatCard
          title="Total Savings"
          value={formatCurrency(financialData.totalSavings, currencySymbol)}
          subtitle="Allocated to reserve goals"
          icon={PiggyBank}
          type="savings"
          trend="+15.0%"
          trendDirection="up"
        />
      </div>

      {/* Main Charts Row: Cashflow Trends + Expense Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <IncomeVsExpenseChart
            data={financialData.cashflowSeries}
            currencySymbol={currencySymbol}
          />
        </div>
        <div className="lg:col-span-5">
          <ExpenseDonutChart
            data={financialData.expenseBreakdown}
            totalSpent={financialData.totalExpenses}
            currencySymbol={currencySymbol}
          />
        </div>
      </div>

      {/* Secondary Row: Category Budget Progress Bars + Recent Transactions Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <BudgetProgressList
            budgets={recentBudgets}
            currencySymbol={currencySymbol}
          />
        </div>
        <div className="lg:col-span-6">
          <RecentTransactions
            transactions={recentTransactions}
            currencySymbol={currencySymbol}
          />
        </div>
      </div>

      {/* Rapid Quick-Add Transaction Drawer */}
      <TransactionDrawer
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
        categories={categories}
        onCategoryCreated={(newCat) => {
          setCategories((prev) => [...prev, newCat]);
        }}
      />
    </div>
  );
}

export default Dashboard;