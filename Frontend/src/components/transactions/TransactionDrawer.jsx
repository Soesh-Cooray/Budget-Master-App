import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sheet } from '../ui/drawer';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { transactionSchema } from '../../lib/validations';
import { transactionAPI, categoryAPI } from '../../api';
import { useCurrency } from '../../context/CurrencyContext';
import { Plus } from 'lucide-react';

export function TransactionDrawer({
  isOpen,
  onClose,
  onSuccess,
  editingTransaction = null,
  categories = [],
  onCategoryCreated,
}) {
  const { currencySymbol } = useCurrency();
  const [type, setType] = useState(editingTransaction?.transaction_type || 'expense');
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const quickAmounts = [10, 25, 50, 100, 250];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: '',
      transaction_type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const currentAmount = watch('amount');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.transaction_type || 'expense');
      reset({
        description: editingTransaction.description || '',
        amount: editingTransaction.amount?.toString() || '',
        transaction_type: editingTransaction.transaction_type || 'expense',
        category: editingTransaction.category?.id || editingTransaction.category || '',
        date: editingTransaction.date || new Date().toISOString().split('T')[0],
      });
    } else {
      setType('expense');
      reset({
        description: '',
        amount: '',
        transaction_type: 'expense',
        category: categories.length > 0 ? categories[0].id : '',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setShowNewCatInput(false);
    setNewCatName('');
    setErrorMessage('');
  }, [isOpen, editingTransaction, categories, reset]);

  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    setValue('transaction_type', selectedType);
  };

  const handleQuickAmount = (val) => {
    const current = parseFloat(currentAmount) || 0;
    setValue('amount', (current + val).toString());
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await categoryAPI.create({
        name: newCatName.trim(),
        transaction_type: type,
      });
      if (res.data) {
        if (onCategoryCreated) onCategoryCreated(res.data);
        setValue('category', res.data.id);
        setShowNewCatInput(false);
        setNewCatName('');
      }
    } catch (err) {
      console.error('Error creating category:', err);
      setErrorMessage('Failed to create new category. Please try again.');
    }
  };

  const onSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        transaction_type: type,
      };

      if (editingTransaction) {
        await transactionAPI.update(editingTransaction.id, payload);
      } else {
        await transactionAPI.create(payload);
      }

      setIsSubmitting(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setIsSubmitting(false);
      console.error('Failed to save transaction:', err);
      setErrorMessage(
        err.response?.data?.detail || 'Failed to save transaction. Please verify details.'
      );
    }
  };

  const filteredCategories = categories.filter((cat) => {
    if (!cat.transaction_type) return true;
    return cat.transaction_type === type;
  });

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction ? 'Edit Transaction' : 'Quick Add Transaction'}
      description="Record income, expenses, or savings in seconds"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Transaction Type Segmented Controls */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            Transaction Type
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeSelect('expense')}
              className={`h-10 rounded-lg text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('income')}
              className={`h-10 rounded-lg text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('savings')}
              className={`h-10 rounded-lg text-xs font-bold transition-all ${
                type === 'savings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Savings
            </button>
          </div>
        </div>

        {/* Amount Input with Currency Symbol */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            Amount ({currencySymbol})
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-lg">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount')}
              className="h-14 w-full rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 pl-9 pr-4 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>
          )}

          {/* Quick Amount Chips */}
          <div className="flex flex-wrap gap-2 mt-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAmount(amt)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700/60 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 active:scale-95 transition-all"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            Description
          </label>
          <Input
            placeholder="e.g. Grocery shopping, Freelance payout..."
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        {/* Category Selector + Inline Creation */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
            <button
              type="button"
              onClick={() => setShowNewCatInput(!showNewCatInput)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              {showNewCatInput ? 'Choose existing' : 'New category'}
            </button>
          </div>

          {showNewCatInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Category name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-11 flex-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <Button type="button" size="sm" onClick={handleCreateCategory} variant="secondary">
                Add
              </Button>
            </div>
          ) : (
            <select
              {...register('category')}
              className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a category...</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
          {errors.category && (
            <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Date Field */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Date</label>
          <Input type="date" {...register('date')} error={errors.date?.message} />
        </div>

        {/* Submit Actions */}
        <div className="pt-3 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={type === 'income' ? 'income' : type === 'savings' ? 'default' : 'expense'}
            className="flex-1 font-bold shadow-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : editingTransaction ? 'Update Entry' : 'Add Entry'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
