import { z } from 'zod';

export const transactionSchema = z.object({
  description: z.string().min(2, 'Description must be at least 2 characters'),
  amount: z
    .union([z.string(), z.number()])
    .refine((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return !isNaN(num) && num > 0;
    }, 'Amount must be greater than 0')
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val)),
  transaction_type: z.enum(['expense', 'income', 'savings'], {
    required_error: 'Select a transaction type',
  }),
  category: z
    .union([z.string(), z.number()])
    .refine((val) => val !== '' && val !== null && val !== undefined, 'Please select a category'),
  date: z.string().min(1, 'Date is required'),
});

export const budgetSchema = z.object({
  category: z
    .union([z.string(), z.number()])
    .refine((val) => val !== '' && val !== null && val !== undefined, 'Please select a category'),
  budgetAmount: z
    .union([z.string(), z.number()])
    .refine((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return !isNaN(num) && num > 0;
    }, 'Budget limit must be greater than 0')
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val)),
  period: z.enum(['weekly', 'monthly', 'yearly'], {
    required_error: 'Select a budget period',
  }),
  startDate: z.string().min(1, 'Start date is required'),
});
