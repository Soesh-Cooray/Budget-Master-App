import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
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
import Sidebar from './components/sidebar';
import SettingsPage from './components/settings';
import FAQ from './components/faq';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import { DRAWER_WIDTH, COLLAPSED_WIDTH } from './constants';

function App() {
    const location = useLocation();
    const showSidebar = ['/transaction', '/budgets', '/savings-goals', '/debts', '/reports', '/dashboard', '/settings', '/faq'].includes(location.pathname);
    const [open, setOpen] = useState(() => window.innerWidth >= 960);

    const handleDrawerToggle = () => {
        setOpen((prev) => !prev);
    };


    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            html, body {
                overflow-y: auto;
                overflow-x: hidden;
                width: 100%;
                height: auto;
                min-height: 100vh;
            }
            #root {
                height: auto;
                min-height: 100vh;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    useEffect(() => {
        console.log("Current location:", location.pathname);
    }, [location]);

    return (
        <ThemeProvider>
            <Analytics />
            <ThemeToggle />
            <Box sx={{
                display: 'flex',
                margin: 0,
                padding: 0,
                width: '100%',
                height: 'auto',
                minHeight: '100vh',
                overflow: 'auto',
            }}>
                {showSidebar && (
                    <Sidebar open={open} onClose={handleDrawerToggle} />
                )}

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        width: showSidebar ?
                            `calc(100% - ${open ? DRAWER_WIDTH : COLLAPSED_WIDTH}px)` :
                            '100%',
                        marginLeft: showSidebar ?
                            `${open ? DRAWER_WIDTH : COLLAPSED_WIDTH}px` :
                            0,
                        transition: (theme) =>
                            theme.transitions.create(['width', 'margin'], {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.standard,
                            }),
                        padding: 0,
                        overflow: 'visible',
                    }}
                >
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/signin" element={<SignInPage />} />
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/transaction" element={<TransactionsPage />} />
                        <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password-confirm" element={<ResetPasswordConfirmPage />} />
                        <Route path="/budgets" element={<BudgetsPage />} />
                        <Route path="/savings-goals" element={<SavingsGoalsPage />} />
                        <Route path="/debts" element={<DebtPage />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;