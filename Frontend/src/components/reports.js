import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Container, Paper, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, CircularProgress, TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, } from 'chart.js';
import { transactionAPI, getCurrencySymbol } from '../api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const EXPENSE_COLORS = ['#ff6767', '#ff7878', '#ff8989', '#ffaaaa', '#ffcfcf', '#ffe3e3', '#ffeeee'];
const INCOME_COLORS = ['#47894b', '#5ea758', '#8bbd78', '#98c377', '#7be382'];
const SAVINGS_COLORS = ['#1c96c5', '#20a7db', '#62c1e5', '#a0d9ef', '#cfecf7', '#d2ebff'];

const shiftMonth = (date, monthsToShift) => {
  const d = new Date(date);
  const originalDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsToShift);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDay, lastDay));
  return d;
};

const getPeriodsForRange = (startDateStr, endDateStr, timeRange) => {
  const count = parseInt(timeRange) || 1;
  const now = new Date();

  const baseStart = startDateStr ? new Date(startDateStr) : new Date(now.getFullYear(), now.getMonth(), 1);
  const baseEnd = endDateStr ? new Date(endDateStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  let sDate = new Date(baseStart);
  let eDate = new Date(baseEnd);
  if (sDate > eDate) {
    const temp = sDate;
    sDate = eDate;
    eDate = temp;
  }

  const periods = [];
  for (let i = count - 1; i >= 0; i--) {
    const pStart = shiftMonth(sDate, -i);
    pStart.setHours(0, 0, 0, 0);

    const pEnd = shiftMonth(eDate, -i);
    pEnd.setHours(23, 59, 59, 999);

    const isFullCalendarMonth = pStart.getDate() === 1 &&
      pEnd.getDate() === new Date(pEnd.getFullYear(), pEnd.getMonth() + 1, 0).getDate() &&
      pStart.getMonth() === pEnd.getMonth();

    let label;
    if (isFullCalendarMonth) {
      label = pStart.toLocaleString('default', { month: 'short', year: 'numeric' });
    } else {
      const startFmt = pStart.toLocaleString('default', { month: 'short', day: 'numeric' });
      const endFmt = pEnd.toLocaleString('default', { month: 'short', day: 'numeric' });
      label = `${startFmt} - ${endFmt}`;
    }

    periods.push({
      start: pStart,
      end: pEnd,
      label
    });
  }

  for (let i = 0; i < periods.length - 1; i++) {
    if (periods[i].end >= periods[i + 1].start) {
      periods[i].end = new Date(periods[i + 1].start.getTime() - 1);
    }
  }

  return periods;
};

const processIncomeVsExpensesData = (incomes, expenses, periods) => {
  const incomeData = new Array(periods.length).fill(0);
  const expenseData = new Array(periods.length).fill(0);

  incomes.forEach(income => {
    const date = new Date(income.date);
    const periodIndex = periods.findIndex(p => date >= p.start && date <= p.end);
    if (periodIndex !== -1) {
      incomeData[periodIndex] += parseFloat(income.amount);
    }
  });

  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const periodIndex = periods.findIndex(p => date >= p.start && date <= p.end);
    if (periodIndex !== -1) {
      expenseData[periodIndex] += parseFloat(expense.amount);
    }
  });

  return {
    labels: periods.map(p => p.label),
    income: incomeData,
    expenses: expenseData
  };
};

const processExpenseBreakdownData = (expenses) => {
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
    colors: EXPENSE_COLORS.slice(0, labels.length)
  };
};

const processIncomeBreakdownData = (incomes) => {
  const sourceTotals = {};
  let totalIncome = 0;

  incomes.forEach(income => {
    const source = income.category_name || 'Uncategorized';
    const amount = parseFloat(income.amount);
    sourceTotals[source] = (sourceTotals[source] || 0) + amount;
    totalIncome += amount;
  });

  const labels = Object.keys(sourceTotals);
  const values = Object.values(sourceTotals);
  const percentages = values.map(value => ((value / totalIncome) * 100).toFixed(1));

  return {
    labels,
    values,
    percentages,
    colors: INCOME_COLORS.slice(0, labels.length)
  };
};

const processSavingsBreakdownData = (savings) => {
  const categoryTotals = {};
  let totalSavings = 0;

  savings.forEach(saving => {
    const category = saving.category_name || 'Uncategorized';
    const amount = parseFloat(saving.amount);
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    totalSavings += amount;
  });

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);
  const percentages = values.map(value => ((value / totalSavings) * 100).toFixed(1));

  return {
    labels,
    values,
    percentages,
    colors: SAVINGS_COLORS.slice(0, labels.length)
  };
};

const processAllCategorySpendingOverTime = (expenses, incomes, savings, periods) => {
  const getCategories = (arr, key = 'category_name') =>
    [...new Set(arr.map(item => item[key] || 'Uncategorized'))];

  const expenseCategories = getCategories(expenses);
  const incomeCategories = getCategories(incomes);
  const savingsCategories = getCategories(savings);

  const datasets = [
    ...expenseCategories.map((category, idx) => ({
      label: `Expense: ${category}`,
      data: periods.map((p) =>
        expenses
          .filter(e => (e.category_name || 'Uncategorized') === category &&
            new Date(e.date) >= p.start && new Date(e.date) <= p.end)
          .reduce((sum, e) => sum + parseFloat(e.amount), 0)
      ),
      backgroundColor: EXPENSE_COLORS[idx % EXPENSE_COLORS.length],
      stack: 'Expenses',
    })),
    ...incomeCategories.map((category, idx) => ({
      label: `Income: ${category}`,
      data: periods.map((p) =>
        incomes
          .filter(i => (i.category_name || 'Uncategorized') === category &&
            new Date(i.date) >= p.start && new Date(i.date) <= p.end)
          .reduce((sum, i) => sum + parseFloat(i.amount), 0)
      ),
      backgroundColor: INCOME_COLORS[idx % INCOME_COLORS.length],
      stack: 'Income',
    })),
    ...savingsCategories.map((category, idx) => ({
      label: `Savings: ${category}`,
      data: periods.map((p) =>
        savings
          .filter(s => (s.category_name || 'Uncategorized') === category &&
            new Date(s.date) >= p.start && new Date(s.date) <= p.end)
          .reduce((sum, s) => sum + parseFloat(s.amount), 0)
      ),
      backgroundColor: SAVINGS_COLORS[idx % SAVINGS_COLORS.length],
      stack: 'Savings',
    })),
  ];

  return {
    labels: periods.map(p => p.label),
    datasets,
  };
};


const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
}));

const AmountTypography = styled(Typography)(({ theme, color }) => ({
  fontWeight: 'bold',
  color: color === 'income'
    ? '#00C853'
    : color === 'expense'
      ? '#FF3D00'
      : color === 'savings'
        ? '#191CFF'
        : color === 'balance'
          ? theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
          : '#1E88E5',
  fontSize: '2rem',
  marginTop: theme.spacing(1),
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ marginTop: '20px' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('6');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialData, setFinancialData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    netBalance: 0,
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
    },
    categorySpendingOverTime: {
      labels: [],
      datasets: []
    },
    incomeBreakdown: {
      labels: [],
      values: [],
      percentages: [],
      colors: INCOME_COLORS
    },
    savingsBreakdown: {
      labels: [],
      values: [],
      percentages: [],
      colors: SAVINGS_COLORS
    }
  });
  const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [expensesRes, incomesRes, savingsRes] = await Promise.all([
        transactionAPI.getExpenses(),
        transactionAPI.getIncomes(),
        transactionAPI.getSavings()
      ]);
      const expenses = expensesRes.data;
      const incomes = incomesRes.data;
      const savingsTxns = savingsRes.data;

      const periods = getPeriodsForRange(startDate, endDate, timeRange);
      const overallStart = periods[0].start;
      const overallEnd = periods[periods.length - 1].end;

      const filteredIncomes = incomes.filter(item => {
        const d = new Date(item.date);
        return d >= overallStart && d <= overallEnd;
      });
      const filteredExpenses = expenses.filter(item => {
        const d = new Date(item.date);
        return d >= overallStart && d <= overallEnd;
      });
      const filteredSavings = savingsTxns.filter(item => {
        const d = new Date(item.date);
        return d >= overallStart && d <= overallEnd;
      });

      const totalIncome = filteredIncomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const totalSavings = filteredSavings.reduce((sum, saving) => sum + parseFloat(saving.amount), 0);
      const netBalance = totalIncome - totalExpenses - totalSavings;

      const incomeVsExpenses = processIncomeVsExpensesData(incomes, expenses, periods);

      const expenseBreakdown = processExpenseBreakdownData(filteredExpenses);
      const incomeBreakdown = processIncomeBreakdownData(filteredIncomes);
      const savingsBreakdown = processSavingsBreakdownData(filteredSavings);
      const categorySpending = processAllCategorySpendingOverTime(expenses, incomes, savingsTxns, periods);

      setFinancialData({
        totalIncome,
        totalExpenses,
        totalSavings,
        netBalance,
        incomeVsExpenses,
        expenseBreakdown,
        categorySpendingOverTime: categorySpending,
        incomeBreakdown,
        savingsBreakdown
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Failed to load reports data');
      setLoading(false);
    }
  }, [timeRange, startDate, endDate]);

  useEffect(() => {
    fetchData();
    const updateCurrency = () => setCurrencySymbol(getCurrencySymbol());
    window.addEventListener('currencyChange', updateCurrency);
    return () => window.removeEventListener('currencyChange', updateCurrency);
  }, [fetchData]);


  // Chart configurations
  const incomeExpenseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
          borderDash: [5, 5],
        },
        ticks: {
          callback: (value) => `${value}`,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${currencySymbol}${context.parsed.y.toLocaleString()}`,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}% (${currencySymbol}${value.toLocaleString()})`;
          },
        },
      },
    },
  };


  const categorySpendingOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
          borderDash: [5, 5],
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => {
            return `${context.dataset.label}: ${currencySymbol}${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'flex-end' }}
        gap={2}
        mb={3.5}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Financial Reports
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Visualize your financial trends and patterns
          </Typography>
        </Box>

        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent="flex-start"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={1.5}
          width={{ xs: '100%', md: 'auto' }}
        >
          <TextField
            type="date"
            label="Start Date"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: { xs: '100%', sm: 165 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff',
              }
            }}
          />
          <TextField
            type="date"
            label="End Date"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: { xs: '100%', sm: 165 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff',
              }
            }}
          />
          <FormControl
            variant="outlined"
            size="small"
            sx={{
              width: { xs: '100%', sm: 175 },
            }}
          >
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
              sx={{
                borderRadius: 2.5,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff',
              }}
            >
              <MenuItem value="1">This month</MenuItem>
              <MenuItem value="3">Last 3 months</MenuItem>
              <MenuItem value="6">Last 6 months</MenuItem>
              <MenuItem value="12">Last year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <StyledCard>
            <Card sx={{ height: '100%', minHeight: 150, width: '100%', padding: 2, }}>
              <Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Total Income
                </Typography>
                <AmountTypography color="income">
                  {currencySymbol}{financialData.totalIncome.toLocaleString()}
                </AmountTypography>
              </Box>
            </Card>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={3}>
          <StyledCard>
            <Card sx={{ height: '100%', minHeight: 150, width: '100%', padding: 2, }}>
              <Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Total Expenses
                </Typography>
                <AmountTypography color="expense">
                  {currencySymbol}{financialData.totalExpenses.toLocaleString()}
                </AmountTypography>
              </Box>
            </Card>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={3}>
          <StyledCard>
            <Card sx={{ height: '100%', minHeight: 150, width: '100%', padding: 2, }}>
              <Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Total Savings
                </Typography>
                <AmountTypography color="savings">
                  {currencySymbol}{financialData.totalSavings?.toLocaleString()}
                </AmountTypography>
              </Box>
            </Card>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={3}>
          <StyledCard>
            <Card sx={{ height: '100%', minHeight: 150, width: '100%', padding: 2, }}>
              <Box>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Net Balance
                </Typography>
                <AmountTypography color="balance">
                  {currencySymbol}{financialData.netBalance.toLocaleString()}
                </AmountTypography>
              </Box>
            </Card>
          </StyledCard>
        </Grid>
      </Grid>

      <Paper sx={{
        mb: 4,
        borderRadius: 4
      }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: 'divider', borderRadius: 4 }}
        >
          <Tab label="Overview" />
          <Tab label="Expenses" />
          <Tab label="Income" />
          <Tab label="Savings" />
          <Tab label="Trends" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <StyledCard>
            <Card sx={{ height: 500, width: '100%', }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Income vs Expenses
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Your financial balance over time
                </Typography>
                <Box height={350}>
                  <Bar
                    data={{
                      labels: financialData.incomeVsExpenses.labels,
                      datasets: [
                        {
                          label: 'Income',
                          data: financialData.incomeVsExpenses.income,
                          backgroundColor: '#00C853',
                          barThickness: 20,
                        },
                        {
                          label: 'Expenses',
                          data: financialData.incomeVsExpenses.expenses,
                          backgroundColor: '#FF3D00',
                          barThickness: 20,
                        },
                      ],
                    }}
                    options={incomeExpenseChartOptions}
                  />
                </Box>
              </CardContent>
            </Card>
          </StyledCard>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expense Category Breakdown
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Breakdown of your spending by category
              </Typography>
              <Box height={400} display="flex" justifyContent="center">
                <Box width="70%" height="100%">
                  <Pie
                    data={{
                      labels: financialData.expenseBreakdown.labels,
                      datasets: [{
                        data: financialData.expenseBreakdown.values,
                        backgroundColor: financialData.expenseBreakdown.colors,
                        borderWidth: 0,
                      }],
                    }}
                    options={pieOptions}
                  />
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Income Sources Breakdown
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Distribution of your income by source
              </Typography>
              <Box height={400} display="flex" justifyContent="center">
                <Box width="70%" height="100%">
                  <Pie
                    data={{
                      labels: financialData.incomeBreakdown?.labels || [],
                      datasets: [{
                        data: financialData.incomeBreakdown?.values || [],
                        backgroundColor: financialData.incomeBreakdown?.colors || [],
                        borderWidth: 0,
                      }],
                    }}
                    options={pieOptions}
                  />
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Savings Breakdown
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Distribution of your savings by category
              </Typography>
              <Box height={400} display="flex" justifyContent="center">
                <Box width="70%" height="100%">
                  <Pie
                    data={{
                      labels: financialData.savingsBreakdown.labels,
                      datasets: [{
                        data: financialData.savingsBreakdown.values,
                        backgroundColor: financialData.savingsBreakdown.colors,
                        borderWidth: 0,
                      }],
                    }}
                    options={{
                      ...pieOptions,
                      plugins: {
                        ...pieOptions.plugins,
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label || '';
                              const value = context.parsed || 0;
                              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${percentage}% (${currencySymbol}${value.toLocaleString()})`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Income Vs Expenses Vs Savings Over Time
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Track how your spending, income & savings change over time
              </Typography>
              <Box height={400}>
                <Bar
                  data={financialData.categorySpendingOverTime}
                  options={categorySpendingOptions}
                />
              </Box>
            </CardContent>
          </StyledCard>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Reports;