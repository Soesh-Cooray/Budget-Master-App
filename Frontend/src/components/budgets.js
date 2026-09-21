import React, { useState, useEffect, useCallback } from 'react';
import { isSameMonth, isSameYear, isSameWeek } from 'date-fns';
import { Plus, PieChart, Edit2, Trash2 } from 'lucide-react';
import { budgetAPI, categoryAPI, transactionAPI } from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../lib/utils';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Sheet } from './ui/drawer';
import { Input } from './ui/input';

export function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currencySymbol } = useCurrency();

  // Drawer / Form state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [budgetsRes, categoriesRes, transactionsRes] = await Promise.all([
        budgetAPI.getAll(),
        categoryAPI.getExpenseCategories(),
        transactionAPI.getExpenses(),
      ]);

      setBudgets(budgetsRes.data || []);
      setCategories(categoriesRes.data || []);
      setExpenses(transactionsRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching budget data:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setCategory(categories.length > 0 ? categories[0].id : '');
    setAmount('');
    setPeriod('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (budget) => {
    setEditingBudget(budget);
    const catId = typeof budget.category === 'object' ? budget.category.id : budget.category;
    setCategory(catId);
    setAmount(budget.amount);
    setPeriod(budget.period || 'monthly');
    setStartDate(budget.start_date || new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !amount || parseFloat(amount) <= 0) {
      setFormError('Please select a category and enter a valid budget amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      const payload = {
        category_id: category,
        amount: parseFloat(amount),
        period,
        start_date: startDate,
      };

      if (editingBudget) {
        await budgetAPI.update(editingBudget.id, payload);
      } else {
        await budgetAPI.create(payload);
      }

      setIsSubmitting(false);
      setIsDrawerOpen(false);
      fetchData();
    } catch (err) {
      setIsSubmitting(false);
      console.error('Failed to save budget:', err);
      setFormError('Failed to save budget. Please check inputs.');
    }
  };

  const handleDelete = async () => {
    if (!budgetToDelete) return;
    try {
      await budgetAPI.delete(budgetToDelete.id);
      setBudgets((prev) => prev.filter((b) => b.id !== budgetToDelete.id));
      setBudgetToDelete(null);
    } catch (err) {
      console.error('Failed to delete budget:', err);
      alert('Failed to delete budget.');
    }
  };

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-white via-indigo-50/50 to-white dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Budgets
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Spending Allocation
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Set and monitor category limits to prevent overspending.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="default"
          className="rounded-xl font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0 touch-target"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Budget</span>
        </Button>
      </div>

      {/* Budget Cards Grid */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {budgets.map((budget) => {
            const bCatId = typeof budget.category === 'object' ? budget.category.id : budget.category;
            const categoryObj = categories.find((c) => c.id === bCatId);
            const categoryName = categoryObj ? categoryObj.name : 'Category';

            const spent = expenses
              .filter((exp) => {
                const expCatId = typeof exp.category === 'object' ? exp.category.id : exp.category;
                if (Number(expCatId) !== Number(bCatId)) return false;

                if (!exp.date) return false;
                const expDate = new Date(exp.date);
                const now = new Date();
                
                const period = budget.period ? budget.period.toLowerCase() : 'monthly';
                
                if (period === 'monthly') {
                  return isSameMonth(expDate, now) && isSameYear(expDate, now);
                } else if (period === 'yearly') {
                  return isSameYear(expDate, now);
                } else if (period === 'weekly') {
                  return isSameWeek(expDate, now, { weekStartsOn: 1 }) && isSameYear(expDate, now);
                }
                
                return true;
              })
              .reduce((sum, exp) => sum + Math.abs(parseFloat(exp.amount || 0)), 0);

            const total = Number(budget.amount || 1);
            const remaining = Math.max(0, total - spent);
            const percentage = Math.min(100, Math.round((spent / total) * 100));
            const isExceeded = spent > total;
            const isWarning = percentage >= 75 && !isExceeded;

            let statusBg = 'bg-emerald-500';
            let textColor = 'text-emerald-600 dark:text-emerald-400';
            let badgeStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

            if (isExceeded) {
              statusBg = 'bg-rose-500 shadow-sm shadow-rose-500/50';
              textColor = 'text-rose-600 dark:text-rose-400';
              badgeStyle = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
            } else if (isWarning) {
              statusBg = 'bg-amber-500 shadow-sm shadow-amber-500/50';
              textColor = 'text-amber-600 dark:text-amber-400';
              badgeStyle = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
            }

            return (
              <Card key={budget.id} className="relative group hover:border-slate-300 dark:hover:border-slate-700/80 transition-all">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Card Header: Category & Actions */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100 block">
                        {categoryName}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                          {isExceeded ? 'Limit Exceeded' : isWarning ? 'Approaching Limit' : 'Within Budget'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                          {budget.period || 'monthly'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(budget)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Budget"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setBudgetToDelete(budget)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Budget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between border-t border-slate-200/80 dark:border-slate-800/80 pt-3">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Spent:</span>
                      <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(spent, currencySymbol)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Limit:</span>
                      <div className="text-sm font-bold font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatCurrency(total, currencySymbol)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${statusBg}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  {/* Footer Stats */}
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Remaining:{' '}
                      <strong className="font-mono text-slate-700 dark:text-slate-200 tabular-nums">
                        {formatCurrency(remaining, currencySymbol)}
                      </strong>
                    </span>
                    <span className={`font-mono font-bold tabular-nums ${textColor}`}>
                      {percentage}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
              <PieChart className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">No active category budgets</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Define spending limits for food, rent, shopping, and utilities to gain financial clarity.
            </p>
            <Button variant="default" size="sm" onClick={handleOpenAdd}>
              Create First Budget
            </Button>
          </div>
        </Card>
      )}

      {/* Add / Edit Budget Drawer */}
      <Sheet
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingBudget ? 'Edit Budget' : 'Create Budget'}
        description="Allocate monthly or weekly limits for a category"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Budget Limit ({currencySymbol})
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="e.g. 500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="pt-3 flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDrawerOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1 font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingBudget ? 'Update Budget' : 'Create Budget'}
            </Button>
          </div>
        </form>
      </Sheet>

      {/* Delete Confirmation Modal */}
      {budgetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Delete Budget?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove this budget allocation? Past transactions will remain untouched.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setBudgetToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 font-bold"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetsPage;