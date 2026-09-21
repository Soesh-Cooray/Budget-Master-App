import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight, PiggyBank } from 'lucide-react';
import { formatCurrency, getCategoryBadgeStyle } from '../../lib/utils';

export function TransactionRow({
  transaction,
  currencySymbol = '$',
  onEdit,
  onDelete,
}) {
  const isIncome = transaction.transaction_type === 'income';
  const isSavings = transaction.transaction_type === 'savings';
  const badge = getCategoryBadgeStyle(transaction.category_name);

  // Framer Motion Drag values
  const x = useMotionValue(0);
  const editOpacity = useTransform(x, [10, 60], [0, 1]);
  const deleteOpacity = useTransform(x, [-10, -60], [0, 1]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 80) {
      onEdit(transaction);
    } else if (info.offset.x < -80) {
      onDelete(transaction);
    }
  };

  return (
    <>
      {/* Mobile Swipeable Card Item */}
      <div className="md:hidden relative overflow-hidden rounded-2xl mb-2.5">
        {/* Background Action Reveals */}
        <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none">
          {/* Swipe Right = Edit (Indigo) */}
          <motion.div
            style={{ opacity: editOpacity }}
            className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <span>Edit</span>
          </motion.div>

          {/* Swipe Left = Delete (Rose) */}
          <motion.div
            style={{ opacity: deleteOpacity }}
            className="flex items-center gap-1.5 text-rose-400 font-bold text-xs"
          >
            <span>Delete</span>
            <div className="w-8 h-8 rounded-full bg-rose-600/30 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
          </motion.div>
        </div>

        {/* Foreground Draggable Surface */}
        <motion.div
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -100, right: 100 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          className="relative z-10 p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md flex items-center justify-between gap-3 active:cursor-grabbing cursor-grab select-none"
        >
          {/* Icon & Details */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                isIncome
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : isSavings
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
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
              <p className="text-sm font-bold text-slate-100 truncate">{transaction.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">{transaction.date}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                  {transaction.category_name || 'General'}
                </span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <div
              className={`font-mono font-bold text-base tabular-nums ${
                isIncome
                  ? 'text-emerald-400'
                  : isSavings
                  ? 'text-indigo-400'
                  : 'text-rose-400'
              }`}
            >
              {isIncome ? '+' : isSavings ? '' : '−'}
              {formatCurrency(transaction.amount, currencySymbol)}
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-0.5">
              Swipe to action
            </span>
          </div>
        </motion.div>
      </div>

      {/* Desktop Table Row */}
      <tr className="hidden md:table-row hover:bg-slate-800/30 border-b border-slate-800/80 transition-colors group">
        <td className="py-3.5 px-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                isIncome
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : isSavings
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
              }`}
            >
              {isIncome ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : isSavings ? (
                <PiggyBank className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
            <span className="font-semibold text-sm text-slate-100 truncate max-w-xs">
              {transaction.description}
            </span>
          </div>
        </td>
        <td className="py-3.5 px-4 text-xs font-medium text-slate-400">{transaction.date}</td>
        <td className="py-3.5 px-4">
          <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
            {transaction.category_name || 'General'}
          </span>
        </td>
        <td className="py-3.5 px-4">
          <span
            className={`text-xs font-semibold capitalize ${
              isIncome
                ? 'text-emerald-400'
                : isSavings
                ? 'text-indigo-400'
                : 'text-rose-400'
            }`}
          >
            {transaction.transaction_type}
          </span>
        </td>
        <td className="py-3.5 px-4 text-right">
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
            {formatCurrency(transaction.amount, currencySymbol)}
          </span>
        </td>
        <td className="py-3.5 px-4 text-right">
          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(transaction)}
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(transaction)}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}
