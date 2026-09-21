import React from 'react';
import { Search, RotateCcw, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export function TransactionFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onTypeChange,
  filterCategory,
  onCategoryChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  categories = [],
  sortOrder,
  onToggleSort,
  onReset,
}) {
  const hasActiveFilters =
    searchTerm || filterType !== 'all' || filterCategory !== 'all' || startDate || endDate;

  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        {/* Row 1: Search bar and Type Filter Pills */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 w-full rounded-xl bg-slate-950/70 border border-slate-700/80 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Type Segmented Control */}
          <div className="flex p-1 rounded-xl bg-slate-950/70 border border-slate-800 shrink-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'expense', label: 'Expenses' },
              { id: 'income', label: 'Income' },
              { id: 'savings', label: 'Savings' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onTypeChange(t.id)}
                className={`h-9 px-3 sm:px-4 rounded-lg text-xs font-semibold transition-all ${
                  filterType === t.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Category, Dates, and Sort / Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Category Dropdown */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="h-11 w-full rounded-xl bg-slate-950/70 border border-slate-700/80 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              placeholder="From Date"
              className="h-11 w-full rounded-xl bg-slate-950/70 border border-slate-700/80 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              placeholder="To Date"
              className="h-11 w-full rounded-xl bg-slate-950/70 border border-slate-700/80 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions: Sort & Reset */}
          <div className="flex gap-2">
            <button
              onClick={onToggleSort}
              className={`h-11 flex-1 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
                sortOrder
                  ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                  : 'bg-slate-950/70 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
              title="Sort by amount"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortOrder === 'asc' ? 'Low to High' : sortOrder === 'desc' ? 'High to Low' : 'Sort'}
            </button>

            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="h-11 px-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 flex items-center justify-center transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
