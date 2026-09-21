import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

function ThemeToggle() {
    const { mode, toggleColorMode } = useCustomTheme();
    const isDark = mode === 'dark';

    return (
        <Box
            sx={{
                position: 'fixed',
                top: { xs: 14, sm: 20 },
                right: { xs: 14, sm: 24 },
                zIndex: 1250,
            }}
        >
            <Tooltip
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                placement="left"
                arrow
            >
                <IconButton
                    onClick={toggleColorMode}
                    aria-label="Toggle light and dark mode"
                    sx={{
                        width: { xs: 42, sm: 46 },
                        height: { xs: 42, sm: 46 },
                        borderRadius: '50%',
                        backgroundColor: isDark
                            ? 'rgba(30, 30, 30, 0.75)'
                            : 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'}`,
                        boxShadow: isDark
                            ? '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 215, 0, 0.2)'
                            : '0 4px 20px rgba(34, 67, 115, 0.12), 0 0 12px rgba(25, 118, 210, 0.1)',
                        color: isDark ? '#ffd54f' : '#1976d2',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            transform: 'translateY(-2px) scale(1.08)',
                            backgroundColor: isDark
                                ? 'rgba(45, 45, 45, 0.9)'
                                : 'rgba(255, 255, 255, 0.98)',
                            borderColor: isDark
                                ? 'rgba(255, 215, 0, 0.5)'
                                : 'rgba(25, 118, 210, 0.4)',
                            boxShadow: isDark
                                ? '0 6px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(255, 215, 0, 0.35)'
                                : '0 6px 24px rgba(34, 67, 115, 0.2), 0 0 16px rgba(25, 118, 210, 0.25)',
                            '& .toggle-icon': {
                                transform: 'rotate(45deg) scale(1.12)',
                            },
                        },
                        '&:active': {
                            transform: 'scale(0.94)',
                        },
                    }}
                >
                    {isDark ? (
                        <Brightness7Icon
                            className="toggle-icon"
                            sx={{
                                fontSize: { xs: 22, sm: 24 },
                                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                filter: 'drop-shadow(0 0 6px rgba(255, 213, 79, 0.7))',
                            }}
                        />
                    ) : (
                        <Brightness4Icon
                            className="toggle-icon"
                            sx={{
                                fontSize: { xs: 22, sm: 24 },
                                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                filter: 'drop-shadow(0 0 6px rgba(25, 118, 210, 0.5))',
                            }}
                        />
                    )}
                </IconButton>
            </Tooltip>
        </Box>
    );
}

export default ThemeToggle;
