
import axios from 'axios';

const PRODUCTION_API_BASE = 'https://production-budget-master-backend.vercel.app';

const resolveApiBase = () => {
  const envBase = process.env.REACT_APP_API_BASE;
  if (envBase) {
    return envBase;
  }

  if (typeof window !== 'undefined' && window.__API_BASE__) {
    return window.__API_BASE__;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    return isLocal ? 'http://127.0.0.1:8000' : PRODUCTION_API_BASE;
  }

  return PRODUCTION_API_BASE;
};

// Root API base (frontend can still override with REACT_APP_API_BASE).
export const API_BASE = resolveApiBase();

// Budget endpoints live under /api/
export const apiClient = axios.create({
  baseURL: `${API_BASE}/api/`,
});


apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Transaction API
export const transactionAPI = {
  getAll: () => apiClient.get('transactions/'),
  getExpenses: (startDate, endDate) => apiClient.get('transactions/expenses/', {
    params: { start_date: startDate, end_date: endDate }
  }),
  getIncomes: (startDate, endDate) => apiClient.get('transactions/income/', {
    params: { start_date: startDate, end_date: endDate }
  }),
  getSavings: (startDate, endDate) => apiClient.get('transactions/savings/', {
    params: { start_date: startDate, end_date: endDate }
  }),
  create: (transactionData) => apiClient.post('transactions/', transactionData),
  update: (id, transactionData) => apiClient.put(`transactions/${id}/`, transactionData),
  delete: (id) => apiClient.delete(`transactions/${id}/`),
};

// Category API
export const categoryAPI = {
  getAll: () => apiClient.get('categories/'),
  getExpenseCategories: () => apiClient.get('categories/expense_categories/'),
  getIncomeCategories: () => apiClient.get('categories/income_categories/'),
  getSavingsCategories: () => apiClient.get('categories/savings_categories/'),
  create: (categoryData) => apiClient.post('categories/', categoryData),
  update: (id, categoryData) => apiClient.put(`categories/${id}/`, categoryData),
  delete: (id) => apiClient.delete(`categories/${id}/`),
};

// Budget API
export const budgetAPI = {
  getAll: () => apiClient.get('budgets/'),
  create: (budgetData) => apiClient.post('budgets/', budgetData),
  update: (id, budgetData) => apiClient.put(`budgets/${id}/`, budgetData),
  delete: (id) => apiClient.delete(`budgets/${id}/`),
};

export const savingsGoalAPI = {
  getAll: () => apiClient.get('savings-goals/'),
  create: (goalData) => apiClient.post('savings-goals/', goalData),
  update: (id, goalData) => apiClient.put(`savings-goals/${id}/`, goalData),
  delete: (id) => apiClient.delete(`savings-goals/${id}/`),
};

export const debtAPI = {
  getAll: () => apiClient.get('debts/'),
  create: (debtData) => apiClient.post('debts/', debtData),
  update: (id, debtData) => apiClient.put(`debts/${id}/`, debtData),
  delete: (id) => apiClient.delete(`debts/${id}/`),
  getHistory: (id) => apiClient.get(`debts/${id}/history/`),
};

//  currency list
export const currencyList = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
  { code: 'ISK', symbol: 'kr', name: 'Icelandic Krona' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial' },
  { code: 'DZD', symbol: 'دج', name: 'Algerian Dinar' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
  { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee' },
  { code: 'BHD', symbol: 'ب.د', name: 'Bahraini Dinar' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA franc' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA franc' },
  { code: 'XPF', symbol: '₣', name: 'CFP franc' },
];


export function getCurrencySymbol() {
  const currency = localStorage.getItem('currency') || 'USD';
  const found = currencyList.find(cur => cur.code === currency);
  return found ? found.symbol : '$';
}

const api = {
  transaction: transactionAPI,
  category: categoryAPI,
  budget: budgetAPI,
  savingsGoal: savingsGoalAPI,
  debt: debtAPI,
};

export default api;