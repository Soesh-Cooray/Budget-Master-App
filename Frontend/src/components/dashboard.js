import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Grid, LinearProgress, List, ListItem, Chip, Avatar, CircularProgress, Card, useTheme, TextField, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import SavingsSharpIcon from '@mui/icons-material/SavingsSharp';
import FlagIcon from '@mui/icons-material/Flag';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { transactionAPI, budgetAPI, categoryAPI, savingsGoalAPI, getCurrencySymbol, apiClient, API_BASE } from '../api';
import { format, subDays } from 'date-fns';

// Register the chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const EXPENSE_COLORS = ['#ec407a', '#7c4dff', '#ff7043', '#4caf50', '#ff9800', '#2196f3'];

const formatDateForApi = (date) => format(date, 'yyyy-MM-dd');

const getMonthsInRange = (startDate, endDate) => {
  const months = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    months.push(format(currentDate, 'MMM'));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  return months;
};

const processIncomeVsExpensesData = (incomes, expenses, months) => {
  const incomeData = new Array(months.length).fill(0);
  const expenseData = new Array(months.length).fill(0);

  incomes.forEach(income => {
    const date = new Date(income.date);
    const monthIndex = months.indexOf(format(date, 'MMM'));
    if (monthIndex !== -1) {
      incomeData[monthIndex] += parseFloat(income.amount);
    }
  });

  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const monthIndex = months.indexOf(format(date, 'MMM'));
    if (monthIndex !== -1) {
      expenseData[monthIndex] += parseFloat(expense.amount);
    }
  });

  return {
    labels: months,
    income: incomeData,
    expenses: expenseData
  };
};

const processExpenseBreakdownData = (expenses, colors) => {
  const categoryTotals = {};
  let totalExpenses = 0;

  expenses.forEach(expense => {
    const category = expense.category_name || 'Uncategorized';
    const amount = parseFloat(expense.amount);
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    totalExpenses += amount;
  });

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);
  const percentages = values.map(value => ((value / totalExpenses) * 100).toFixed(1));

  return {
    labels,
    values,
    percentages,
    colors: colors.slice(0, labels.length)
  };
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
}));

const StatCard = styled(StyledPaper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: theme.spacing(0.5),
  color: theme.palette.text.primary,
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
}));

const BudgetProgressCard = ({ name, spent, amount, remaining, percent, currencySymbol }) => {
  const theme = useTheme();
  return (
    <Card sx={{
      p: { xs: 2, sm: 2.5 },
      borderRadius: 3,
      boxShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(0,0,0,0.05)',
      mb: 2,
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
      backgroundColor: theme.palette.background.paper,
    }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary, wordBreak: 'break-word' }}>{name}</Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.5} mb={1}>
        <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary, whiteSpace: 'nowrap' }}>{currencySymbol}{spent.toFixed(2)}</Typography>
        <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary, whiteSpace: 'nowrap' }}>of {currencySymbol}{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5',
          mb: 1
        }}
      />
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.5}>
        <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>Remaining: {currencySymbol}{Number(remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>{percent.toFixed(0)}%</Typography>
      </Box>
    </Card>
  );
};

const SavingsGoalCard = ({ title, categoryName, currentAmount, targetAmount, remaining, percent, currencySymbol }) => {
  const theme = useTheme();
  return (
    <Card sx={{
      p: { xs: 2, sm: 2.5 },
      borderRadius: 3,
      boxShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(0,0,0,0.05)',
      mb: 2,
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
      backgroundColor: theme.palette.background.paper,
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, wordBreak: 'break-word', minWidth: 0, pr: 1 }}>{title}</Typography>
        <FlagIcon sx={{ color: theme.palette.text.secondary, flexShrink: 0 }} />
      </Box>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1, wordBreak: 'break-word' }}>{categoryName}</Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.5} mb={1}>
        <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary, whiteSpace: 'nowrap' }}>{currencySymbol}{currentAmount.toFixed(2)}</Typography>
        <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary, whiteSpace: 'nowrap' }}>of {currencySymbol}{targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5',
          mb: 1
        }}
      />
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.5}>
        <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>Remaining: {currencySymbol}{remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>{percent.toFixed(0)}%</Typography>
      </Box>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const savedStartDate = localStorage.getItem('dashboardStartDate');
    return savedStartDate ? new Date(savedStartDate) : subDays(new Date(), 30);
  });
  const [endDate, setEndDate] = useState(() => {
    const savedEndDate = localStorage.getItem('dashboardEndDate');
    return savedEndDate ? new Date(savedEndDate) : new Date();
  });
  const [financialData, setFinancialData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    currentBalance: 0,
    incomeVsExpenses: {
      labels: [],
      income: [],
      expenses: []
    },
    expenseBreakdown: {
      labels: [],
      values: [],
      percentages: [],
      colors: EXPENSE_COLORS
    }
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentBudgets, setRecentBudgets] = useState([]);
  const [recentSavingsGoals, setRecentSavingsGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol());
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleStartDateChange = (newValue) => {
    setStartDate(newValue);
    localStorage.setItem('dashboardStartDate', newValue.toISOString());
  };

  const handleEndDateChange = (newValue) => {
    setEndDate(newValue);
    localStorage.setItem('dashboardEndDate', newValue.toISOString());
  };

  useEffect(() => {
    fetchUserInfo();
    const updateCurrency = () => setCurrencySymbol(getCurrencySymbol());
    window.addEventListener('currencyChange', updateCurrency);
    return () => window.removeEventListener('currencyChange', updateCurrency);
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get('/auth/users/me/', {
        baseURL: API_BASE
      });
      setFirstName(response.data.first_name || '');
      setUsername(response.data.username || response.data.email || '');
    } catch (err) {
      console.error('Error fetching user info:', err);
      // Fallback to empty strings if API call fails
      setFirstName('');
      setUsername('');
    }
  };
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const formattedStartDate = formatDateForApi(startDate);
      const formattedEndDate = formatDateForApi(endDate);

      const [expensesRes, incomesRes, savingsRes, budgetsRes, categoriesRes, savingsGoalsRes] = await Promise.all([
        transactionAPI.getExpenses(formattedStartDate, formattedEndDate),
        transactionAPI.getIncomes(formattedStartDate, formattedEndDate),
        transactionAPI.getSavings(formattedStartDate, formattedEndDate),
        budgetAPI.getAll(),
        categoryAPI.getExpenseCategories(),
        savingsGoalAPI.getAll()
      ]);

      const expenses = expensesRes.data;
      const incomes = incomesRes.data;
      const savingsTxns = savingsRes.data;
      const budgets = budgetsRes.data;
      const savingsGoals = savingsGoalsRes.data;
      const allTransactions = [...expenses, ...incomes, ...savingsTxns].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(allTransactions);
      setCategories(categoriesRes.data);

      // Calculate totals
      const totalIncome = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const totalSavings = savingsTxns.reduce((sum, saving) => sum + parseFloat(saving.amount), 0);
      const currentBalance = totalIncome - totalExpenses - totalSavings;
      const monthsInRange = getMonthsInRange(startDate, endDate);
      const incomeVsExpenses = processIncomeVsExpensesData(incomes, expenses, monthsInRange);
      const expenseBreakdown = processExpenseBreakdownData(expenses, EXPENSE_COLORS);

      setFinancialData({
        totalIncome,
        totalExpenses,
        totalSavings,
        currentBalance,
        incomeVsExpenses,
        expenseBreakdown
      });

      // Set 5 most recent transactions
      setRecentTransactions(allTransactions.slice(0, 5));

      // Set 2 most recently updated budgets (by created_at desc)
      const sortedBudgets = budgets
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentBudgets(sortedBudgets.slice(0, 2));

      const sortedGoals = savingsGoals
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentSavingsGoals(sortedGoals.slice(0, 2));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: '#f0f0f0',
        },
        ticks: {
          stepSize: 15000,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
  };

  const addMonthsClamped = (date, months) => {
    const base = new Date(date);
    const day = base.getDate();
    base.setDate(1);
    base.setMonth(base.getMonth() + months);
    const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    base.setDate(Math.min(day, lastDay));
    return base;
  };

  const addYearsClamped = (date, years) => {
    const base = new Date(date);
    const day = base.getDate();
    base.setDate(1);
    base.setFullYear(base.getFullYear() + years);
    const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    base.setDate(Math.min(day, lastDay));
    return base;
  };

  const getNextPeriodDate = (date, period) => {
    if (period === 'weekly') {
      const next = new Date(date);
      next.setDate(next.getDate() + 7);
      return next;
    }
    if (period === 'yearly') {
      return addYearsClamped(date, 1);
    }
    return addMonthsClamped(date, 1);
  };

  const getActivePeriodRange = (budget) => {
    const start = new Date(budget.start_date);
    if (Number.isNaN(start.getTime())) {
      return null;
    }

    const now = new Date();
    let periodStart = new Date(start);
    let periodEnd = getNextPeriodDate(periodStart, budget.period);
    let guard = 0;

    while (periodEnd <= now && guard < 600) {
      periodStart = periodEnd;
      periodEnd = getNextPeriodDate(periodStart, budget.period);
      guard += 1;
    }

    return { periodStart, periodEnd };
  };

  // Helper to calculate spent for a budget
  const calculateSpent = (budget) => {
    const activeRange = getActivePeriodRange(budget);
    if (!activeRange) {
      return 0;
    }

    const { periodStart, periodEnd } = activeRange;

    return transactions
      .filter(txn => {
        const txnCatId = Number(typeof txn.category === 'object' ? txn.category.id : txn.category);
        const budgetCatId = Number(typeof budget.category === 'object' ? budget.category.id : budget.category);
        return (
          txnCatId === budgetCatId &&
          new Date(txn.date) >= periodStart &&
          new Date(txn.date) < periodEnd
        );
      })
      .reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 1.5, sm: 2.5, md: 3 },
      minHeight: '100vh',
      maxWidth: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      bgcolor: theme.palette.background.default
    }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5, color: theme.palette.text.primary, fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' }, wordBreak: 'break-word' }}>
        {firstName ? `${getGreeting()}, ${firstName}` : (username ? `${getGreeting()}, ${username}` : getGreeting())}
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 2, wordBreak: 'break-word' }}>
        Here's an overview of your finances
      </Typography>

      {/* Date Range Picker */}
      <Paper
        elevation={0}
        sx={{
          mb: 3.5,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2.5,
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            alignItems: { xs: 'stretch', sm: 'center' },
            width: '100%',
            '& .MuiTextField-root': {
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1.5,
              width: { xs: '100%', sm: '200px' }
            }
          }}>
            <DatePicker
              label="From Date"
              value={startDate}
              onChange={handleStartDateChange}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
            <DatePicker
              label="To Date" value={endDate}
              onChange={handleEndDateChange}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
            <Button
              variant="contained"
              onClick={fetchData}
              sx={{
                height: 53,
                px: 4,
                width: { xs: '100%', sm: 'auto' },
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
                boxShadow: 'none'
              }}
            >
              Update
            </Button>
          </Box>
        </LocalizationProvider>
      </Paper>

      {/* Stat Cards */}
      <Box sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard sx={{ p: { xs: 2, sm: 2.5 }, width: '100%', boxSizing: 'border-box' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">Current Balance</Typography>
                <AccountBalanceWalletIcon sx={{ color: theme.palette.mode === 'dark' ? '#F7FDFF' : '#000000' }} />
              </Box>
              <StatValue sx={{ wordBreak: 'break-word', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>{currencySymbol}{financialData.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</StatValue>
              <StatLabel>Total balance across all accounts</StatLabel>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard sx={{ p: { xs: 2, sm: 2.5 }, width: '100%', boxSizing: 'border-box' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">Total Income</Typography>
                <ArrowCircleUpIcon sx={{ color: theme.palette.mode === 'dark' ? '#81c784' : '#2eb432' }} />
              </Box>
              <StatValue sx={{ color: theme.palette.mode === 'dark' ? '#81c784' : '#4caf50', wordBreak: 'break-word', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {currencySymbol}{financialData.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </StatValue>
              <StatLabel>Total income this period</StatLabel>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard sx={{ p: { xs: 2, sm: 2.5 }, width: '100%', boxSizing: 'border-box' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">Total Expenses</Typography>
                <ArrowCircleDownIcon sx={{ color: theme.palette.mode === 'dark' ? '#e57373' : '#f44336' }} />
              </Box>
              <StatValue sx={{ color: theme.palette.mode === 'dark' ? '#e57373' : '#f44336', wordBreak: 'break-word', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {currencySymbol}{financialData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </StatValue>
              <StatLabel>Total expenses this period</StatLabel>
            </StatCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard sx={{ p: { xs: 2, sm: 2.5 }, width: '100%', boxSizing: 'border-box' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">Total Savings</Typography>
                <SavingsSharpIcon sx={{ color: theme.palette.mode === 'dark' ? '#7986cb' : '#3949ab' }} />
              </Box>
              <StatValue sx={{ color: theme.palette.mode === 'dark' ? '#7986cb' : '#3949ab', wordBreak: 'break-word', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {currencySymbol}{financialData.totalSavings?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </StatValue>
              <StatLabel>Total savings this period</StatLabel>
            </StatCard>
          </Grid>
        </Grid>
      </Box>

      {/* Charts */}
      <Box sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          <Grid item xs={12} sm={6} md={6}>
            <StyledPaper sx={{ p: { xs: 2, sm: 2.5 }, width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
              <Typography variant="h6" sx={{ mb: 0.5, color: theme.palette.text.primary }}>Income vs Expenses</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>Your financial balance over time</Typography>
              <Box sx={{ height: { xs: 280, sm: 380 }, width: '100%', maxWidth: '100%' }}>
                <Bar
                  data={{
                    labels: financialData.incomeVsExpenses.labels,
                    datasets: [
                      {
                        label: 'Income',
                        data: financialData.incomeVsExpenses.income,
                        backgroundColor: theme.palette.mode === 'dark' ? '#81c784' : '#4caf50',
                        barThickness: 30,
                      },
                      {
                        label: 'Expenses',
                        data: financialData.incomeVsExpenses.expenses,
                        backgroundColor: theme.palette.mode === 'dark' ? '#e57373' : '#f44336',
                        barThickness: 30,
                      },
                    ],
                  }}
                  options={{
                    ...barChartOptions,
                    maintainAspectRatio: false,
                    scales: {
                      ...barChartOptions.scales,
                      y: {
                        ...barChartOptions.scales.y,
                        grid: {
                          ...barChartOptions.scales.y.grid,
                          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0',
                        },
                        ticks: {
                          ...barChartOptions.scales.y.ticks,
                          color: theme.palette.text.secondary,
                        },
                      },
                      x: {
                        ...barChartOptions.scales.x,
                        ticks: {
                          color: theme.palette.text.secondary,
                        },
                      },
                    },
                    plugins: {
                      ...barChartOptions.plugins,
                      legend: {
                        ...barChartOptions.plugins.legend,
                        labels: {
                          ...barChartOptions.plugins.legend.labels,
                          color: theme.palette.text.secondary,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </StyledPaper>
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <StyledPaper sx={{ p: { xs: 2, sm: 2.5 }, width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
              <Typography variant="h6" sx={{ mb: 0.5, color: theme.palette.text.primary }}>Expense Breakdown</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>Your spending by category</Typography>
              <Box sx={{ height: { xs: 260, sm: 340 }, width: '100%', maxWidth: '100%', display: 'flex', justifyContent: 'center', mx: 'auto' }}>
                <Doughnut
                  data={{
                    labels: financialData.expenseBreakdown.labels,
                    datasets: [{
                      data: financialData.expenseBreakdown.values,
                      backgroundColor: financialData.expenseBreakdown.colors,
                      borderWidth: 0,
                      cutout: '70%',
                    }],
                  }}
                  options={{
                    ...doughnutChartOptions,
                    maintainAspectRatio: false,
                    plugins: {
                      ...doughnutChartOptions.plugins,
                      tooltip: {
                        ...doughnutChartOptions.plugins.tooltip,
                        titleColor: theme.palette.text.primary,
                        bodyColor: theme.palette.text.secondary,
                        backgroundColor: theme.palette.background.paper,
                        borderColor: theme.palette.divider,
                        borderWidth: 1,
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2, pb: 1 }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {financialData.expenseBreakdown.labels.map((label, index) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: financialData.expenseBreakdown.colors[index] }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, whiteSpace: 'nowrap' }}>
                        {label} {financialData.expenseBreakdown.percentages[index]}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </StyledPaper>
          </Grid>
        </Grid>
      </Box>

      {/* Recent Transactions */}
      <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.text.primary }}>Recent Transactions</Typography>
      <Paper sx={{
        mb: 4,
        p: { xs: 1, sm: 2 },
        borderRadius: 3,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark' ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(0,0,0,0.05)',
      }}>
        <List disablePadding>
          {recentTransactions.map((transaction) => {
            const isIncome = transaction.transaction_type === 'income';
            return (
              <ListItem
                key={transaction.id}
                divider
                sx={{
                  px: { xs: 1, sm: 2 },
                  py: 1.25,
                }}
              >
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <Avatar sx={{
                    bgcolor: isIncome
                      ? theme.palette.mode === 'dark' ? 'rgba(129, 199, 132, 0.15)' : '#e8f5e9'
                      : theme.palette.mode === 'dark' ? 'rgba(229, 115, 115, 0.15)' : '#ffebee',
                    color: isIncome
                      ? theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32'
                      : theme.palette.mode === 'dark' ? '#e57373' : '#d32f2f',
                    width: 36,
                    height: 36,
                    mr: 1.5,
                    flexShrink: 0,
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}>
                    {isIncome ? '+' : '−'}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0, pr: 1.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {transaction.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 0.25 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>
                        {transaction.date}
                      </Typography>
                      <Chip
                        label={transaction.category_name || 'Unknown'}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.625rem',
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.04)',
                          color: theme.palette.text.secondary
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      textAlign: 'right',
                      color: isIncome
                        ? theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32'
                        : theme.palette.mode === 'dark' ? '#e57373' : '#d32f2f'
                    }}
                  >
                    {isIncome ? '+' : '−'}{currencySymbol}{parseFloat(transaction.amount).toFixed(2)}
                  </Typography>
                </Box>
              </ListItem>
            );
          })}
          {recentTransactions.length === 0 && (
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">No recent transactions found.</Typography>
            </Box>
          )}
        </List>
      </Paper>

      {/* Recent Budgets */}
      <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.text.primary }}>Budget Progress</Typography>
      <Box sx={{ width: '100%', overflow: 'hidden', mb: 4 }}>
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {recentBudgets.map((budget) => {
            const spent = calculateSpent(budget);
            const remaining = Number(budget.amount) - spent;
            const percent = Number(budget.amount) ? Math.min((spent / Number(budget.amount)) * 100, 100) : 0;
            const categoryName = typeof budget.category === 'object' ? budget.category.name : categories.find(cat => cat.id === budget.category)?.name || 'Category';
            return (
              <Grid item xs={12} sm={6} md={4} key={budget.id}>
                <BudgetProgressCard
                  name={categoryName}
                  spent={spent}
                  amount={budget.amount}
                  remaining={remaining}
                  percent={percent}
                  currencySymbol={currencySymbol}
                />
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Recent Savings Goals */}
      <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 'bold', color: theme.palette.text.primary }}>Recent Savings Goals</Typography>
      <Box sx={{ width: '100%', overflow: 'hidden', mb: 4 }}>
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {recentSavingsGoals.map((goal) => {
            const currentAmount = Number(goal.current_amount || 0);
            const targetAmount = Number(goal.target_amount || 0);
            const remaining = Number(goal.remaining_amount || 0);
            const percent = targetAmount ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={goal.id}>
                <SavingsGoalCard
                  title={goal.title}
                  categoryName={goal.category?.name || 'Savings Category'}
                  currentAmount={currentAmount}
                  targetAmount={targetAmount}
                  remaining={remaining}
                  percent={percent}
                  currencySymbol={currencySymbol}
                />
              </Grid>
            );
          })}
          {recentSavingsGoals.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="textSecondary">No savings goals yet.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;