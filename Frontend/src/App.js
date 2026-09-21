import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import HomePage from './components/homepage';
import SignInPage from './components/signin';
import SignUpPage from './components/signup';
import TransactionsPage from './components/transaction';
import ForgotPasswordPage from './components/forgotpasswordpage';
import ResetPasswordConfirmPage from './components/resetpasswordconfirmpage';
import BudgetsPage from './components/budgets';
import SavingsGoalsPage from './components/savingsgoal';
import DebtPage from './components/debt';
import Dashboard from './components/dashboard';
import Reports from './components/reports';
import SettingsPage from './components/settings';
import FAQ from './components/faq';

import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { NotificationBanner } from './components/ui/notification-banner';
import { TransactionDrawer } from './components/transactions/TransactionDrawer';
import { categoryAPI } from './api';

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // Routes where app chrome (sidebar, header, bottom nav) should appear
  const appRoutes = [
    '/dashboard',
    '/transaction',
    '/budgets',
    '/savings-goals',
    '/debts',
    '/reports',
    '/settings',
    '/faq',
  ];
  const isAppShell = appRoutes.includes(location.pathname);

  // Fetch categories once for global Quick-Add
  useEffect(() => {
    if (isAppShell) {
      categoryAPI
        .getAll()
        .then((res) => setCategories(res.data || []))
        .catch(() => {});
    }
  }, [isAppShell]);

  // Page title mapping for header
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Financial Overview';
      case '/transaction':
        return 'Transactions & Activity';
      case '/budgets':
        return 'Budget Allocation';
      case '/savings-goals':
        return 'Savings Goals';
      case '/debts':
        return 'Debt Management';
      case '/reports':
        return 'Analytics & Reports';
      case '/settings':
        return 'Account Settings';
      case '/faq':
        return 'FAQ & Documentation';
      default:
        return 'BudgetMaster';
    }
  };

  return (
    <ThemeProvider>
      {/* Global backend trouble alert banner */}
      <NotificationBanner />

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-300">
        {isAppShell ? (
          <div className="flex flex-1 min-h-screen">
            {/* Desktop Glassy Sidebar */}
            <Sidebar
              open={sidebarOpen}
              onToggle={() => setSidebarOpen((prev) => !prev)}
            />

            {/* Main Content Area */}
            <div
              className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
                sidebarOpen ? 'md:ml-64' : 'md:ml-20'
              }`}
            >
              {/* Sticky Top Header */}
              <Header title={getPageTitle()} />

              {/* Scrollable Page Body */}
              <main className="flex-1 overflow-x-hidden">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/transaction" element={<TransactionsPage />} />
                  <Route path="/budgets" element={<BudgetsPage />} />
                  <Route path="/savings-goals" element={<SavingsGoalsPage />} />
                  <Route path="/debts" element={<DebtPage />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>

              {/* Mobile Fixed Glassy Bottom Navigation */}
              <BottomNav onOpenQuickAdd={() => setQuickAddOpen(true)} />
            </div>

            {/* Global Rapid Quick-Add Drawer triggered from Mobile Bottom Nav FAB */}
            <TransactionDrawer
              isOpen={quickAddOpen}
              onClose={() => setQuickAddOpen(false)}
              onSuccess={() => {
                // Dispatch event so active page refreshes
                window.dispatchEvent(new Event('transaction-created'));
              }}
              categories={categories}
              onCategoryCreated={(newCat) => {
                setCategories((prev) => [...prev, newCat]);
              }}
            />
          </div>
        ) : (
          /* Public / Auth Pages (Home, Signin, Signup, Forgot Password) */
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
              <Route path="/reset-password-confirm" element={<ResetPasswordConfirmPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;