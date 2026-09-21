import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  type = 'default',
}) {
  const typeStyles = {
    default: {
      gradient: 'from-indigo-500/10 to-transparent',
      border: 'hover:border-indigo-500/30',
      iconBg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
      valueColor: 'text-slate-100',
    },
    income: {
      gradient: 'from-emerald-500/10 to-transparent',
      border: 'hover:border-emerald-500/30',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
      valueColor: 'text-emerald-400',
    },
    expense: {
      gradient: 'from-rose-500/10 to-transparent',
      border: 'hover:border-rose-500/30',
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
      valueColor: 'text-rose-400',
    },
    savings: {
      gradient: 'from-purple-500/10 to-transparent',
      border: 'hover:border-purple-500/30',
      iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
      valueColor: 'text-purple-400',
    },
  };

  const style = typeStyles[type] || typeStyles.default;

  return (
    <Card
      className={cn(
        'relative group hover:shadow-2xl hover:shadow-black/40 transition-all duration-300',
        style.border
      )}
    >
      {/* Subtle top corner gradient */}
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl rounded-tr-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity',
          style.gradient
        )}
      />

      <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full">
        {/* Header row: Title & Icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {title}
          </span>
          {Icon && (
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                style.iconBg
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Main Value with strict Tabular numbers */}
        <div className="mb-2">
          <div
            className={cn(
              'text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums break-words',
              style.valueColor
            )}
          >
            {value}
          </div>
        </div>

        {/* Footer row: Trend badge & subtitle */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
          <span className="text-slate-400 truncate">{subtitle}</span>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md shrink-0 font-mono text-[11px]',
                trendDirection === 'up'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              )}
            >
              {trendDirection === 'up' ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
