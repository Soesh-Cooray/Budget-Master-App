import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ReceiptText, ArrowUpDown, AlertCircle } from 'lucide-react';
import { transactionAPI, categoryAPI, getCurrencySymbol } from '../api';
import { TransactionFilters } from './transactions/TransactionFilters';
import { TransactionRow } from './transactions/TransactionRow';
import { TransactionDrawer } from './transactions/TransactionDrawer';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol());

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState(null); // 'asc' | 'desc' | null

  // Drawer / Modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Delete modal state
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  useEffect(() => {
    const updateCurrency = () => setCurrencySymbol(getCurrencySymbol());
    window.addEventListener('currencyChange', updateCurrency);
    return () => window.removeEventListener('currencyChange', updateCurrency);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [expensesRes, incomesRes, savingsRes, categoriesRes] = await Promise.all([
        transactionAPI.getExpenses(),
        transactionAPI.getIncomes(),
        transactionAPI.getSavings(),
        categoryAPI.getAll(),
      ]);

      const expenses = expensesRes.data || [];
      const incomes = incomesRes.data || [];
      const savings = savingsRes.data || [];
      const allCategories = categoriesRes.data || [];

      setCategories(allCategories);

      const combined = [...expenses, ...incomes, ...savings].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setTransactions(combined);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Unable to load transaction records. Please check connectivity.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Drawer for New Entry
  const handleOpenNew = () => {
    setEditingTransaction(null);
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleEdit = (txn) => {
    setEditingTransaction(txn);
    setIsDrawerOpen(true);
  };

  // Trigger Delete confirmation
  const handleDeletePrompt = (txn) => {
    setTransactionToDelete(txn);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await transactionAPI.delete(transactionToDelete.id);
      setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete.id));
      setTransactionToDelete(null);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  // Filter and Sort Pipeline
  const filteredTransactions = transactions
    .filter((txn) => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const descMatch = (txn.description || '').toLowerCase().includes(query);
        const catMatch = (txn.category_name || '').toLowerCase().includes(query);
        if (!descMatch && !catMatch) return false;
      }
      // Type
      if (filterType !== 'all' && txn.transaction_type !== filterType) {
        return false;
      }
      // Category
      if (filterCategory !== 'all') {
        const catId = typeof txn.category === 'object' ? txn.category.id : txn.category;
        if (Number(catId) !== Number(filterCategory)) return false;
      }
      // Start Date
      if (startDate && new Date(txn.date) < new Date(startDate)) {
        return false;
      }
      // End Date
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(txn.date) > end) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return parseFloat(a.amount || 0) - parseFloat(b.amount || 0);
      }
      if (sortOrder === 'desc') {
        return parseFloat(b.amount || 0) - parseFloat(a.amount || 0);
      }
      return new Date(b.date) - new Date(a.date);
    });

  const handleToggleSort = () => {
    if (!sortOrder) setSortOrder('desc');
    else if (sortOrder === 'desc') setSortOrder('asc');
    else setSortOrder(null);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
    setSortOrder(null);
  };

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto space-y-6 pb-24 md:pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Transactions
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Financial Activity
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, filter, edit, or log daily cashflow records.
          </p>
        </div>

        <Button
          onClick={handleOpenNew}
          variant="default"
          className="rounded-xl font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0 touch-target"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Transaction</span>
        </Button>
      </div>

      {/* Filter and Search Toolbar */}
      <TransactionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onTypeChange={setFilterType}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        categories={categories}
        sortOrder={sortOrder}
        onToggleSort={handleToggleSort}
        onReset={handleResetFilters}
      />

      {/* Transactions Feed / Table */}
      {filteredTransactions.length > 0 ? (
        <>
          {/* Mobile Swipe-Optimized Card List */}
          <div className="md:hidden space-y-2">
            <p className="text-xs text-slate-400 px-1 mb-2">
              💡 Swipe right to edit • Swipe left to delete
            </p>
            {filteredTransactions.map((txn) => (
              <TransactionRow
                key={txn.id}
                transaction={txn}
                currencySymbol={currencySymbol}
                onEdit={handleEdit}
                onDelete={handleDeletePrompt}
              />
            ))}
          </div>

          {/* Desktop Tabular View */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <TransactionRow
                      key={txn.id}
                      transaction={txn}
                      currencySymbol={currencySymbol}
                      onEdit={handleEdit}
                      onDelete={handleDeletePrompt}
                    />
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
              <ReceiptText className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-200">No transactions match your criteria</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Try adjusting your search terms or clearing active filters to see your records.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Rapid Add / Edit Transaction Drawer */}
      <TransactionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
        editingTransaction={editingTransaction}
        categories={categories}
        onCategoryCreated={(newCat) => {
          setCategories((prev) => [...prev, newCat]);
        }}
      />

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-slate-100">Delete Entry?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete "
              <strong className="text-white">{transactionToDelete.description}</strong>"? This action cannot be reversed.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setTransactionToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 font-bold"
                onClick={confirmDelete}
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

export default TransactionsPage;