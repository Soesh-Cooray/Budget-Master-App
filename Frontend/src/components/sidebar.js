import React, { useState, useEffect } from 'react';
import {
    Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar,
    Typography, IconButton, Box, useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SavingsIcon from '@mui/icons-material/Savings';
import FlagIcon from '@mui/icons-material/Flag';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import BarChartIcon from '@mui/icons-material/BarChart';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useNavigate, useLocation } from 'react-router-dom';
import { DRAWER_WIDTH } from '../constants';

const COLLAPSED_WIDTH = 69;

// List of all currencies 
const currencyList = [
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

function Sidebar({ open, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'USD');

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLogout = () => {
        // Save currency before clearing localStorage
        const savedCurrency = localStorage.getItem('currency');

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Restore currency after logout
        if (savedCurrency) {
            localStorage.setItem('currency', savedCurrency);
        }

        navigate('/signin');
    };

    // Load currency from localStorage on component mount
    useEffect(() => {
        const savedCurrency = localStorage.getItem('currency');
        if (savedCurrency) {
            setCurrency(savedCurrency);
        }
    }, []);

    const isActive = (path) => location.pathname === path;

    const handleCurrencyChange = (event) => {
        setCurrency(event.target.value);
        localStorage.setItem('currency', event.target.value);
        window.dispatchEvent(new Event('currencyChange'));
    };

    return (
        <Drawer
            variant="permanent"
            anchor="left"
            sx={{
                width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
                flexShrink: 0,
                position: 'fixed',
                zIndex: (theme) => theme.zIndex.drawer + 2,
                '& .MuiDrawer-paper': {
                    width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                    paddingRight: 0,
                    borderRight: 0,
                    position: 'fixed',
                    zIndex: (theme) => theme.zIndex.drawer + 2,
                    transition: (theme) =>
                        theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.standard,
                        }),
                },
            }}
        >
            <Toolbar
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: open ? 'space-between' : 'center',
                    px: open ? 2 : 1,
                }}
            >
                {open && (
                    <Typography
                        variant="h6"
                        noWrap
                        sx={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                    >
                        BudgetMaster
                    </Typography>
                )}
                <IconButton
                    onClick={onClose}
                    sx={{
                        borderRadius: '8px',
                        ml: open ? 'auto' : 0,
                        transition: 'background-color 0.3s ease',
                        '&:hover': {
                            backgroundColor: '#4caf50',
                            color: '#fff',
                        },
                        '&:hover svg': {
                            color: '#fff',
                        },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            </Toolbar>

            <List
                sx={{
                    width: '100%',
                    '& .MuiListItem-root': {
                        borderRadius: '8px',
                        mx: 1,
                        width: 'calc(100% - 16px)',
                        my: 0.5,
                        transition: 'background-color 0.3s ease',
                        cursor: 'pointer',
                    },
                    '& .MuiListItem-root:not(.logout-item):hover': {
                        backgroundColor: '#4caf50',
                        color: '#fff',
                    },
                    '& .MuiListItem-root:not(.logout-item):hover .MuiListItemIcon-root': {
                        color: '#fff',
                    },
                }}
            >
                <ListItem
                    button
                    key="Dashboard"
                    onClick={() => handleNavigation('/dashboard')}
                    sx={{
                        backgroundColor: isActive('/dashboard') ? 'rgba(128, 128, 128, 0.68)' : 'transparent',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: open ? 'flex-start' : 'center' }}>
                        <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" sx={{ opacity: open ? 1 : 0 }} />
                </ListItem>

                <ListItem
                    button
                    key="Transactions"
                    onClick={() => handleNavigation('/transaction')}
                    sx={{
                        backgroundColor: isActive('/transaction') ? 'rgba(128, 128, 128, 0.68)' : 'transparent',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: open ? 'flex-start' : 'center' }}>
                        <AttachMoneyIcon />
                    </ListItemIcon>
                    <ListItemText primary="Transactions" sx={{ opacity: open ? 1 : 0 }} />
                </ListItem>

                <ListItem
                    button
                    key="Budgets"
                    onClick={() => handleNavigation('/budgets')}
                    sx={{
                        backgroundColor: isActive('/budgets') ? 'rgba(128, 128, 128, 0.68)' : 'transparent',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: open ? 'flex-start' : 'center' }}>
                        <SavingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Budgets" sx={{ opacity: open ? 1 : 0 }} />
                </ListItem>

                <ListItem
                    button
                    key="SavingsGoals"
                    onClick={() => handleNavigation('/savings-goals')}
                    sx={{
                        backgroundColor: isActive('/savings-goals') ? 'rgba(128, 128, 128, 0.68)' : 'transparent',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: open ? 'flex-start' : 'center' }}>
                        <FlagIcon />
                    </ListItemIcon>
                    <ListItemText primary="Savings Goals" sx={{ opacity: open ? 1 : 0 }} />
                </ListItem>

                <ListItem
                    button
                    key="Debts"
                    onClick={() => handleNavigation('/debts')}
                    sx={{
                        backgroundColor: isActive('/debts') ? 'rgba(128, 128, 128, 0.68)' : 'transparent',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: open ? 'flex-start' : 'center' }}>
                        <CreditCardIcon />
                    </ListItemIcon>
                    <ListItemText primary="Debt Management" sx={{ opacity: open ? 1 : 0 }} />
                </ListItem>

                <ListItem
                    button
                    key="Reports"
                    onClick={() => handleNavigation('/reports')}
                    sx={{
                        backgroundColor: isActive('/reports') ? 'rgba(128, 128, 128, 0.68)' : 'transparent',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: open ? 'flex-start' : 'center' }}>
                        <BarChartIcon />
                    </ListItemIcon>
                    <ListItemText primary="Reports" sx={{ opacity: open ? 1 : 0 }} />
                </ListItem>

                <ListItem
                    button
                    key="Settings"
                    onClick={() => handleNavigation('/settings')}
                    sx={{
                        backgroundColor: isActive('/settings') ? 'rgba(128, 128, 128, 0.68)' : 'transparent',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: open ? 'flex-start' : 'center' }}>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Settings" sx={{ opacity: open ? 1 : 0 }} />
                </ListItem>

                <ListItem
                    button
                    key="FAQ"
                    onClick={() => handleNavigation('/faq')}
                    sx={{
                        backgroundColor: isActive('/faq') ? 'rgba(128, 128, 128, 0.68)' : 'transparent',
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: open ? 'flex-start' : 'center' }}>
                        <HelpOutlineIcon />
                    </ListItemIcon>
                    <ListItemText primary="FAQ" sx={{ opacity: open ? 1 : 0 }} />
                </ListItem>

                <ListItem
                    button
                    key="Logout"
                    onClick={handleLogout}
                    className="logout-item"
                    sx={{
                        '&:hover': {
                            backgroundColor: '#f44336', // red
                            color: '#fff',
                        },
                        '&:hover .MuiListItemIcon-root': {
                            color: '#fff',
                        },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: 3, justifyContent: open ? 'flex-start' : 'center' }}>
                        <ExitToAppIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" sx={{ opacity: open ? 1 : 0 }} />
                </ListItem>
            </List>

            <Box sx={{ mt: 'auto', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Currency Label */}
                {open && (
                    <Box sx={{ display: 'flex', alignItems: 'left', justifyContent: 'center', mt: 3, mb: 1, width: '100%' }}>
                        <AttachMoneyIcon sx={{ mr: 1 }} />
                        <Typography sx={{ fontWeight: 500, textAlign: 'left' }}>Currency</Typography>
                    </Box>
                )}
                {/* Currency Selector */}
                {open && (
                    <select
                        value={currency}
                        onChange={handleCurrencyChange}
                        style={{
                            borderRadius: 6,
                            padding: '8px 12px',
                            fontSize: 15,
                            minWidth: 220,
                            width: '100%',
                            textAlign: 'left',
                            display: 'block',
                            margin: '0 auto',
                            background: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                            border: `1px solid ${theme.palette.divider}`,
                            transition: 'background 0.3s, color 0.3s'
                        }}
                    >
                        {currencyList.map((cur) => (
                            <option key={cur.code} value={cur.code}>
                                {cur.code} {cur.symbol} - {cur.name}
                            </option>
                        ))}
                    </select>
                )}
            </Box>
        </Drawer>
    );
}

export default Sidebar;