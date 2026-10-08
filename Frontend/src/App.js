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
import { CurrencyProvider } from './context/CurrencyContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { NotificationBanner } from './components/ui/notification-banner';
import { TransactionDrawer } from './components/transactions/TransactionDrawer';
import { categoryAPI, API_BASE } from './api';
import axios from 'axios';

// ── ProtectedRoute ────────────────────────────────────────────────────────────
// Validates the stored JWT on every app-shell mount.
// • No tokens         → redirect to /signin immediately.
// • Access token OK   → render children.
// • Access token 401  → try silent refresh; redirect to /signin on failure.
function ProtectedRoute({ children }) {
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'ok' | 'redirect'

  useEffect(() => {
    let cancelled = false;

    const validate = async () => {
      const access = localStorage.getItem('accessToken');
      const refresh = localStorage.getItem('refreshToken');

      // No tokens at all — go to sign-in
      if (!access && !refresh) {
        if (!cancelled) setAuthState('redirect');
        return;
      }

      // Try a lightweight authenticated request to verify the access token
      try {
        await axios.get(`${API_BASE}/auth/users/me/`, {
          headers: { Authorization: `Bearer ${access}` },
          timeout: 8000,
        });
        if (!cancelled) setAuthState('ok');
      } catch (err) {
        if (err.response?.status === 401 && refresh) {
          // Access token expired — try to refresh
          try {
            const res = await axios.post(`${API_BASE}/auth/jwt/refresh/`, { refresh });
            localStorage.setItem('accessToken', res.data.access);
            if (!cancelled) setAuthState('ok');
          } catch {
            // Refresh also failed — fully expired session
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (!cancelled) setAuthState('redirect');
          }
        } else if (!err.response) {
          // Network error — allow through (offline / server down)
          if (!cancelled) setAuthState('ok');
        } else {
          // Other error (403, etc.) — redirect for safety
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (!cancelled) setAuthState('redirect');
        }
      }
    };

    validate();
    return () => { cancelled = true; };
  }, []);

  if (authState === 'checking') {
    // Brief loading screen while we verify the session
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg, #0f172a)',
      }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #334155',
            borderTop: '3px solid #6366f1', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ fontSize: 14, margin: 0 }}>Verifying session…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (authState === 'redirect') {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
// ──────────────────────────────────────────────────────────────────────────────

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
      <CurrencyProvider>
        {/* Global backend trouble alert banner */}
        <NotificationBanner />

        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
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
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/transaction" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
                    <Route path="/budgets" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />
                    <Route path="/savings-goals" element={<ProtectedRoute><SavingsGoalsPage /></ProtectedRoute>} />
                    <Route path="/debts" element={<ProtectedRoute><DebtPage /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
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
      </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;