import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Scale,
  Calendar,
  RefreshCw,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { transactionAPI } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { StatCard } from './dashboard/StatCard';

// Curated high-contrast, accessible color palette for categories
const CATEGORY_COLORS = [
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#a855f7', // Purple
];

const shiftMonth = (date, monthsToShift) => {
  const d = new Date(date);
  const originalDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsToShift);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDay, lastDay));
  return d;
};

const getPeriodsForRange = (startDateStr, endDateStr, timeRange) => {
  const count = parseInt(timeRange, 10) || 1;
  const now = new Date();

  const baseStart = startDateStr
    ? new Date(startDateStr)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const baseEnd = endDateStr
    ? new Date(endDateStr)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  let sDate = new Date(baseStart);
  let eDate = new Date(baseEnd);
  if (sDate > eDate) {
    const temp = sDate;
    sDate = eDate;
    eDate = temp;
  }

  const periods = [];
  for (let i = count - 1; i >= 0; i--) {
    const pStart = shiftMonth(sDate, -i);
    pStart.setHours(0, 0, 0, 0);

    const pEnd = shiftMonth(eDate, -i);
    pEnd.setHours(23, 59, 59, 999);

    const isFullCalendarMonth =
      pStart.getDate() === 1 &&
      pEnd.getDate() === new Date(pEnd.getFullYear(), pEnd.getMonth() + 1, 0).getDate() &&
      pStart.getMonth() === pEnd.getMonth();

    let label;
    if (isFullCalendarMonth) {
      label = pStart.toLocaleString('default', { month: 'short', year: 'numeric' });
    } else {
      const startFmt = pStart.toLocaleString('default', { month: 'short', day: 'numeric' });
      const endFmt = pEnd.toLocaleString('default', { month: 'short', day: 'numeric' });
      label = `${startFmt} - ${endFmt}`;
    }

    periods.push({
      start: pStart,
      end: pEnd,
      label,
    });
  }

  for (let i = 0; i < periods.length - 1; i++) {
    if (periods[i].end >= periods[i + 1].start) {
      periods[i].end = new Date(periods[i + 1].start.getTime() - 1);
    }
  }

  return periods;
};

export default function Reports() {
  const { currencySymbol } = useCurrency();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'expenses' | 'income' | 'savings' | 'trends'
  const [timeRange, setTimeRange] = useState('6');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Raw fetched lists
  const [rawExpenses, setRawExpenses] = useState([]);
  const [rawIncomes, setRawIncomes] = useState([]);
  const [rawSavings, setRawSavings] = useState([]);

  // Active hovered segment in Donut charts
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [expensesRes, incomesRes, savingsRes] = await Promise.all([
        transactionAPI.getExpenses(),
        transactionAPI.getIncomes(),
        transactionAPI.getSavings(),
      ]);
      setRawExpenses(expensesRes.data || []);
      setRawIncomes(incomesRes.data || []);
      setRawSavings(savingsRes.data || []);
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Failed to load reports data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Quick Range Presets
  const handleQuickPreset = (months) => {
    setTimeRange(String(months));
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const start = shiftMonth(end, -(months - 1));
    start.setDate(1);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Process periods and metrics
  const {
    periods,
    filteredExpenses,
    filteredIncomes,
    filteredSavings,
    totalIncome,
    totalExpenses,
    totalSavings,
    netBalance,
    savingsRate,
    expenseRatio,
    cashflowData,
    expenseBreakdown,
    incomeBreakdown,
    savingsBreakdown,
  } = useMemo(() => {
    const pList = getPeriodsForRange(startDate, endDate, timeRange);
    if (!pList.length) {
      return {
        periods: [],
        filteredExpenses: [],
        filteredIncomes: [],
        filteredSavings: [],
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        netBalance: 0,
        savingsRate: 0,
        expenseRatio: 0,
        cashflowData: [],
        expenseBreakdown: [],
        incomeBreakdown: [],
        savingsBreakdown: [],
      };
    }

    const overallStart = pList[0].start;
    const overallEnd = pList[pList.length - 1].end;

    const fExpenses = rawExpenses.filter((item) => {
      const d = new Date(item.date);
      return d >= overallStart && d <= overallEnd;
    });
    const fIncomes = rawIncomes.filter((item) => {
      const d = new Date(item.date);
      return d >= overallStart && d <= overallEnd;
    });
    const fSavings = rawSavings.filter((item) => {
      const d = new Date(item.date);
      return d >= overallStart && d <= overallEnd;
    });

    const totIncome = fIncomes.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    const totExpenses = fExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totSavings = fSavings.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const net = totIncome - totExpenses - totSavings;

    const sRate = totIncome > 0 ? ((totSavings / totIncome) * 100).toFixed(1) : 0;
    const expRatio = totIncome > 0 ? ((totExpenses / totIncome) * 100).toFixed(1) : 0;

    // Period by period cashflow data
    const cData = pList.map((p) => {
      const pIncomes = rawIncomes.filter((i) => {
        const d = new Date(i.date);
        return d >= p.start && d <= p.end;
      });
      const pExpenses = rawExpenses.filter((e) => {
        const d = new Date(e.date);
        return d >= p.start && d <= p.end;
      });
      const pSavings = rawSavings.filter((s) => {
        const d = new Date(s.date);
        return d >= p.start && d <= p.end;
      });

      const inc = pIncomes.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const exp = pExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const sav = pSavings.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const periodNet = inc - exp - sav;
      const periodSavingsRate = inc > 0 ? Number(((sav / inc) * 100).toFixed(1)) : 0;

      return {
        name: p.label,
        income: inc,
        expenses: exp,
        savings: sav,
        net: periodNet,
        savingsRate: periodSavingsRate,
      };
    });

    // Helper to group by category
    const groupByCategory = (items, totalSum) => {
      const map = {};
      items.forEach((item) => {
        const cat = item.category_name || item.source || 'Uncategorized';
        const amt = parseFloat(item.amount) || 0;
        map[cat] = (map[cat] || 0) + amt;
      });

      return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .map(([name, amount], idx) => ({
          name,
          amount,
          percentage: totalSum > 0 ? ((amount / totalSum) * 100).toFixed(1) : '0.0',
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        }));
    };

    const expBreakdown = groupByCategory(fExpenses, totExpenses);
    const incBreakdown = groupByCategory(fIncomes, totIncome);
    const savBreakdown = groupByCategory(fSavings, totSavings);

    return {
      periods: pList,
      filteredExpenses: fExpenses,
      filteredIncomes: fIncomes,
      filteredSavings: fSavings,
      totalIncome: totIncome,
      totalExpenses: totExpenses,
      totalSavings: totSavings,
      netBalance: net,
      savingsRate: sRate,
      expenseRatio: expRatio,
      cashflowData: cData,
      expenseBreakdown: expBreakdown,
      incomeBreakdown: incBreakdown,
      savingsBreakdown: savBreakdown,
    };
  }, [startDate, endDate, timeRange, rawExpenses, rawIncomes, rawSavings]);

  // Glassmorphic Recharts Tooltip for Cashflow
  const CashflowTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const inc = payload.find((p) => p.dataKey === 'income')?.value || 0;
      const exp = payload.find((p) => p.dataKey === 'expenses')?.value || 0;
      const sav = payload.find((p) => p.dataKey === 'savings')?.value || 0;
      const net = inc - exp - sav;

      return (
        <div className="p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 shadow-2xl backdrop-blur-xl text-xs space-y-2 min-w-[190px]">
          <p className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5">
            {label}
          </p>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5 font-sans font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="font-bold tabular-nums">{formatCurrency(inc, currencySymbol)}</span>
            </div>
            <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1.5 font-sans font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Expenses
              </span>
              <span className="font-bold tabular-nums">{formatCurrency(exp, currencySymbol)}</span>
            </div>
            <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
              <span className="flex items-center gap-1.5 font-sans font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Savings
              </span>
              <span className="font-bold tabular-nums">{formatCurrency(sav, currencySymbol)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center font-bold">
              <span className="font-sans text-slate-700 dark:text-slate-300">Net Balance</span>
              <span className={net >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {net >= 0 ? '+' : ''}
                {formatCurrency(net, currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Donut Tooltip
  const DonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 shadow-2xl backdrop-blur-xl text-xs space-y-1 min-w-[150px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
          </div>
          <p className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
            {formatCurrency(item.value, currencySymbol)}
          </p>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {item.payload.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Tab definitions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown, badgeColor: 'text-rose-500' },
    { id: 'income', label: 'Income', icon: TrendingUp, badgeColor: 'text-emerald-500' },
    { id: 'savings', label: 'Savings', icon: PiggyBank, badgeColor: 'text-purple-500' },
    { id: 'trends', label: 'Trends & Matrix', icon: Layers, badgeColor: 'text-indigo-500' },
  ];

  if (loading && !rawExpenses.length && !rawIncomes.length) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Compiling your financial reports...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Top Header & Interactive Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Financial Analytics & Reports
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              <Sparkles className="w-3 h-3" /> Live Insights
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deep dive into your cashflow, category breakdowns, and savings trajectory
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white/70 dark:bg-slate-900/60 p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 dark:border-white/10 backdrop-blur-xl shadow-sm">
          {/* Quick presets */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {[
              { label: '1M', val: '1' },
              { label: '3M', val: '3' },
              { label: '6M', val: '6' },
              { label: '1Y', val: '12' },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => handleQuickPreset(parseInt(p.val, 10))}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all',
                  timeRange === p.val
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date range inputs */}
          <div className="flex items-center gap-2">
            <div className="w-36">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <span className="text-slate-400 text-xs font-bold">to</span>
            <div className="w-36">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            title="Refresh reports"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-indigo-500')} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Inflow"
          value={formatCurrency(totalIncome, currencySymbol)}
          subtitle="Total Income received"
          icon={TrendingUp}
          type="income"
        />
        <StatCard
          title="Total Outflow"
          value={formatCurrency(totalExpenses, currencySymbol)}
          subtitle={`${expenseRatio}% of total income`}
          icon={TrendingDown}
          type="expense"
        />
        <StatCard
          title="Total Savings"
          value={formatCurrency(totalSavings, currencySymbol)}
          subtitle={`${savingsRate}% savings rate`}
          icon={PiggyBank}
          type="savings"
        />
        <StatCard
          title="Net Cashflow"
          value={`${netBalance >= 0 ? '+' : ''}${formatCurrency(netBalance, currencySymbol)}`}
          subtitle={netBalance >= 0 ? 'Surplus retained' : 'Deficit incurred'}
          icon={Scale}
          type={netBalance >= 0 ? 'income' : 'expense'}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-slate-200/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer',
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/80 dark:border-slate-700/80'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <Icon className={cn('w-4 h-4', tab.badgeColor || 'text-indigo-500')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Cashflow Inflow vs Outflow vs Savings
                </CardTitle>
                <CardDescription>
                  Period-by-period comparative breakdown over your selected timeline
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
                </span>
                <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Savings
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {cashflowData.length > 0 ? (
                <div className="w-full h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={cashflowData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? '#334155' : '#e2e8f0'}
                        opacity={0.6}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke={isDark ? '#64748b' : '#94a3b8'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke={isDark ? '#64748b' : '#94a3b8'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) =>
                          `${currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                        }
                      />
                      <Tooltip content={<CashflowTooltip />} cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9', opacity: 0.5 }} />
                      <Bar
                        dataKey="income"
                        name="Income"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                      />
                      <Bar
                        dataKey="expenses"
                        name="Expenses"
                        fill="#f43f5e"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                      />
                      <Bar
                        dataKey="savings"
                        name="Savings"
                        fill="#8b5cf6"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <p>No transaction data available for the chosen date range</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Health Indicators Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Savings Efficiency
                </span>
                <Percent className="w-4 h-4 text-purple-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                  {savingsRate}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">saved from income</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(parseFloat(savingsRate) || 0, 100)}%` }}
                />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Expense Burn Rate
                </span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  {expenseRatio}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">of income spent</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(parseFloat(expenseRatio) || 0, 100)}%` }}
                />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Top Expense Driver
                </span>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2">
                {expenseBreakdown.length > 0 ? (
                  <>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                      {expenseBreakdown[0].name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {formatCurrency(expenseBreakdown[0].amount, currencySymbol)} (
                      {expenseBreakdown[0].percentage}% of spend)
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 mt-1">No expense data</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Expenses Breakdown */}
      {activeTab === 'expenses' && (
        <CategoryBreakdownView
          title="Expense Category Breakdown"
          subtitle="Detailed distribution of your expenses by category"
          items={expenseBreakdown}
          totalAmount={totalExpenses}
          currencySymbol={currencySymbol}
          isDark={isDark}
          emptyText="No expenses logged for the chosen period"
        />
      )}

      {/* TAB CONTENT: Income Breakdown */}
      {activeTab === 'income' && (
        <CategoryBreakdownView
          title="Income Sources Breakdown"
          subtitle="Distribution of your earnings by source"
          items={incomeBreakdown}
          totalAmount={totalIncome}
          currencySymbol={currencySymbol}
          isDark={isDark}
          emptyText="No income logged for the chosen period"
        />
      )}

      {/* TAB CONTENT: Savings Breakdown */}
      {activeTab === 'savings' && (
        <CategoryBreakdownView
          title="Savings Allocation Breakdown"
          subtitle="Distribution of your savings contributions by goal or category"
          items={savingsBreakdown}
          totalAmount={totalSavings}
          currencySymbol={currencySymbol}
          isDark={isDark}
          emptyText="No savings recorded for the chosen period"
        />
      )}

      {/* TAB CONTENT: Trends & Matrix */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Cashflow Trajectory Over Time
              </CardTitle>
              <CardDescription>
                Continuous area curves showing your monthly income, expenditure, and net trajectory
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="w-full h-80 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={cashflowData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                  >
                    <defs>
                      <linearGradient id="incArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="expArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#334155' : '#e2e8f0'}
                      opacity={0.6}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? '#64748b' : '#94a3b8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke={isDark ? '#64748b' : '#94a3b8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) =>
                        `${currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                      }
                    />
                    <Tooltip content={<CashflowTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#incArea)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#expArea)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Breakdown Matrix Table */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <CardTitle className="text-base sm:text-lg">
                Period-by-Period Performance Matrix
              </CardTitle>
              <CardDescription>
                Detailed financial tally of each period in your selection
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-3.5 px-4 sm:px-6">Period</th>
                      <th className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400">Inflow (Income)</th>
                      <th className="py-3.5 px-4 text-rose-600 dark:text-rose-400">Outflow (Expense)</th>
                      <th className="py-3.5 px-4 text-purple-600 dark:text-purple-400">Savings</th>
                      <th className="py-3.5 px-4">Net Cashflow</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Savings Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {cashflowData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 sm:px-6 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {row.name}
                        </td>
                        <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatCurrency(row.income, currencySymbol)}
                        </td>
                        <td className="py-3 px-4 text-rose-600 dark:text-rose-400 tabular-nums">
                          {formatCurrency(row.expenses, currencySymbol)}
                        </td>
                        <td className="py-3 px-4 text-purple-600 dark:text-purple-400 tabular-nums">
                          {formatCurrency(row.savings, currencySymbol)}
                        </td>
                        <td className="py-3 px-4 font-bold tabular-nums">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-xs font-semibold',
                              row.net >= 0
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            )}
                          >
                            {row.net >= 0 ? '+' : ''}
                            {formatCurrency(row.net, currencySymbol)}
                          </span>
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right tabular-nums">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {row.savingsRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Reusable Category Breakdown View (Donut Chart + Ranked Progress Bar List)
 */
function CategoryBreakdownView({
  title,
  subtitle,
  items = [],
  totalAmount = 0,
  currencySymbol = '$',
  isDark = false,
  emptyText = 'No data available',
}) {
  const [activeIdx, setActiveIdx] = useState(null);

  const activeItem = activeIdx !== null ? items[activeIdx] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Donut Chart Card */}
      <Card className="lg:col-span-5 flex flex-col justify-between">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-500" />
            {title}
          </CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>

        <CardContent className="pt-6 flex flex-col items-center justify-center">
          {items.length > 0 && totalAmount > 0 ? (
            <div className="relative w-full h-72 sm:h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        return (
                          <div className="p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 shadow-2xl backdrop-blur-xl text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: item.payload.color }}
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {item.name}
                              </span>
                            </div>
                            <p className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                              {formatCurrency(item.value, currencySymbol)}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {item.payload.percentage}% of total
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={items}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={105}
                    paddingAngle={3}
                    stroke={isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth={2}
                    onMouseEnter={(_, idx) => setActiveIdx(idx)}
                    onMouseLeave={() => setActiveIdx(null)}
                  >
                    {items.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={activeIdx === null || activeIdx === index ? 1 : 0.45}
                        className="transition-opacity duration-200 cursor-pointer"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metric Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {activeItem ? activeItem.name : 'Total Amount'}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(activeItem ? activeItem.amount : totalAmount, currencySymbol)}
                </span>
                <span className="text-xs font-semibold text-indigo-500 font-mono">
                  {activeItem ? `${activeItem.percentage}%` : `${items.length} categories`}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-sm">
              <p>{emptyText}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranked Category Progress List Card */}
      <Card className="lg:col-span-7 flex flex-col">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Ranked Breakdown</CardTitle>
              <CardDescription>
                Sorted by highest financial contribution with visual share
              </CardDescription>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {items.length} Categories
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-4 flex-1">
          {items.length > 0 ? (
            <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                  className={cn(
                    'p-3 rounded-xl border transition-all duration-200 cursor-pointer',
                    activeIdx === idx
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-400/40 shadow-sm'
                      : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(item.amount, currencySymbol)}
                      </span>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Proportion Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <p>{emptyText}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}