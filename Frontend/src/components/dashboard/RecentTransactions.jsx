import React from 'react';
import { ArrowUpRight, ArrowDownRight, PiggyBank, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { formatCurrency, getCategoryBadgeStyle } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export function RecentTransactions({ transactions = [], currencySymbol = '$' }) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest logged transactions</CardDescription>
          </div>
          <button
            onClick={() => navigate('/transaction')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors touch-target"
          >
            All Activity <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            <p>No recent activity. Log your first expense or income!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {transactions.slice(0, 5).map((txn) => {
              const isIncome = txn.transaction_type === 'income';
              const isSavings = txn.transaction_type === 'savings';
              const badge = getCategoryBadgeStyle(txn.category_name);

              return (
                <div
                  key={txn.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-800/20 px-2 rounded-xl transition-colors"
                >
                  {/* Left: Icon and Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : isSavings
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : isSavings ? (
                        <PiggyBank className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-white transition-colors">
                        {txn.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">{txn.date}</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.2 rounded-md border ${badge.bg}`}
                        >
                          {txn.category_name || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-bold text-sm tabular-nums ${
                        isIncome
                          ? 'text-emerald-400'
                          : isSavings
                          ? 'text-indigo-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : isSavings ? '' : '−'}
                      {formatCurrency(txn.amount, currencySymbol)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
