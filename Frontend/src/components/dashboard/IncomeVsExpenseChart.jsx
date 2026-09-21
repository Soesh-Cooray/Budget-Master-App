import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { formatCurrency } from '../../lib/utils';

export function IncomeVsExpenseChart({ data = [], currencySymbol = '$' }) {
  // Custom Dark Glassmorphism Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const income = payload.find((p) => p.dataKey === 'income')?.value || 0;
      const expense = payload.find((p) => p.dataKey === 'expense')?.value || 0;
      const net = income - expense;

      return (
        <div className="p-3.5 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[170px]">
          <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
          <div className="flex justify-between items-center text-emerald-400">
            <span>Income:</span>
            <span className="font-mono font-bold tabular-nums">
              {formatCurrency(income, currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between items-center text-rose-400">
            <span>Expenses:</span>
            <span className="font-mono font-bold tabular-nums">
              {formatCurrency(expense, currencySymbol)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-slate-300 font-semibold">
            <span>Net Balance:</span>
            <span
              className={`font-mono font-bold tabular-nums ${
                net >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {net >= 0 ? '+' : ''}
              {formatCurrency(net, currencySymbol)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <CardTitle>Cashflow Trends</CardTitle>
            <CardDescription>Income vs spending comparison over time</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium mt-2 sm:mt-0">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              Income
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
              Expenses
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
