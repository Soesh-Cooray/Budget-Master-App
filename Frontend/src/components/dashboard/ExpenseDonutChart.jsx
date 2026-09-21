import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { formatCurrency } from '../../lib/utils';

const DEFAULT_COLORS = [
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#a855f7', // Purple
];

export function ExpenseDonutChart({ data = [], totalSpent = 0, currencySymbol = '$' }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const chartData = (data || []).map((item, idx) => ({
    name: item.name || item.category || 'Other',
    value: Number(item.value || item.amount || 0),
    color: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = totalSpent > 0 ? ((item.value / totalSpent) * 100).toFixed(1) : 0;
      return (
        <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
            <span className="font-semibold text-slate-200">{item.name}</span>
          </div>
          <p className="font-mono font-bold text-slate-100 tabular-nums">
            {formatCurrency(item.value, currencySymbol)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Breakdown of expenses for the selected period</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length > 0 && totalSpent > 0 ? (
          <div className="flex flex-col items-center">
            {/* Donut Chart with Center Metric */}
            <div className="relative w-full h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#0f172a"
                    strokeWidth={2}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                        className="transition-opacity duration-200 cursor-pointer"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Total Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Spent
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-slate-100 tabular-nums">
                  {formatCurrency(totalSpent, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Category Legend Badges */}
            <div className="w-full flex flex-wrap justify-center gap-2 mt-2 pt-3 border-t border-slate-800/80 max-h-28 overflow-y-auto">
              {chartData.map((item, idx) => {
                const pct = totalSpent > 0 ? ((item.value / totalSpent) * 100).toFixed(0) : 0;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-medium truncate max-w-[100px]">{item.name}</span>
                    <span className="text-slate-400 font-mono tabular-nums text-[11px]">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
            <p>No expense data recorded for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
