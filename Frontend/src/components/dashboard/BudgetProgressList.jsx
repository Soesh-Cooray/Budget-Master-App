import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { formatCurrency } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export function BudgetProgressList({ budgets = [], currencySymbol = '$' }) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Budget Health</CardTitle>
            <CardDescription>Category allocation limits & real-time burn rate</CardDescription>
          </div>
          <button
            onClick={() => navigate('/budgets')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 transition-colors touch-target"
          >
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <p>No active budgets found. Create one to keep spending in check!</p>
          </div>
        ) : (
          budgets.slice(0, 4).map((budget) => {
            const spent = Number(budget.spent || 0);
            const total = Number(budget.amount || 1);
            const remaining = Math.max(0, total - spent);
            const percentage = Math.min(100, Math.round((spent / total) * 100));
            const isExceeded = spent > total;
            const isWarning = percentage >= 75 && !isExceeded;

            let statusColor = 'bg-emerald-500';
            let textColor = 'text-emerald-600 dark:text-emerald-400';
            let badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

            if (isExceeded) {
              statusColor = 'bg-rose-500 shadow-sm shadow-rose-500/50';
              textColor = 'text-rose-600 dark:text-rose-400';
              badgeBg = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
            } else if (isWarning) {
              statusColor = 'bg-amber-500 shadow-sm shadow-amber-500/50';
              textColor = 'text-amber-600 dark:text-amber-400';
              badgeBg = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
            }

            return (
              <div
                key={budget.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600/80 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                      {budget.category_name || budget.name || 'Category'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      {isExceeded ? 'Exceeded' : isWarning ? 'Warning' : 'On Track'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatCurrency(spent, currencySymbol)}
                    </span>
                    <span className="text-xs text-slate-400"> of </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatCurrency(total, currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Progress bar with dynamic color transition */}
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-slate-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Remaining:{' '}
                    <strong className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                      {formatCurrency(remaining, currencySymbol)}
                    </strong>
                  </span>
                  <span className={`font-mono font-bold tabular-nums ${textColor}`}>
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
