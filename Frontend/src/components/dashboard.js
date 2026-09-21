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
import { formatCurrency, getGreeting } from '../lib/utils';
import { useCurrency } from '../context/CurrencyContext';
import { StatCard } from './dashboard/StatCard';
import { IncomeVsExpenseChart } from './dashboard/IncomeVsExpenseChart';
import { ExpenseDonutChart } from './dashboard/ExpenseDonutChart';
import { BudgetProgressList } from './dashboard/BudgetProgressList';
import { RecentTransactions } from './dashboard/RecentTransactions';
import { TransactionDrawer } from './transactions/TransactionDrawer';
import { Button } from './ui/button';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currencySymbol } = useCurrency();
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem('dashboardStartDate');
    return saved ? new Date(saved) : subDays(new Date(), 30);
  });
  const [endDate, setEndDate] = useState(() => {
    const saved = localStorage.getItem('dashboardEndDate');
    return saved ? new Date(saved) : new Date();
  });

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
      setStartDate(start);
      setEndDate(today);
      localStorage.setItem('dashboardStartDate', start.toISOString());
      localStorage.setItem('dashboardEndDate', today.toISOString());
    } else if (type === 'thisMonth') {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      setStartDate(start);
      setEndDate(end);
      localStorage.setItem('dashboardStartDate', start.toISOString());
      localStorage.setItem('dashboardEndDate', end.toISOString());
    } else if (type === 'all') {
      const start = new Date(today.getFullYear(), 0, 1);
      setStartDate(start);
      setEndDate(today);
      localStorage.setItem('dashboardStartDate', start.toISOString());
      localStorage.setItem('dashboardEndDate', today.toISOString());
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

        {/* Quick Add and Refresh Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => fetchData()}
            variant="outline"
            className="rounded-xl px-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
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

      {/* Date Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl glass-panel text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Period:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setPresetRange('30days')}
              className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setPresetRange('thisMonth')}
              className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              This Month
            </button>
            <button
              onClick={() => setPresetRange('all')}
              className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              Year to Date
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
          <span>{format(startDate, 'MMM d, yyyy')}</span>
          <span>→</span>
          <span>{format(endDate, 'MMM d, yyyy')}</span>
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