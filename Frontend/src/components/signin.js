import React, { useState } from 'react';
import { Box, Card, TextField, Button, Typography, Link, useTheme, CircularProgress } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../api';
import { syncUserPreferencesFromBackend } from '../services/userPreferences';

function SignInPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(`${API_BASE}/auth/jwt/create/`, {
        email,
        password,
      });

      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      try {
        await syncUserPreferencesFromBackend();
      } catch (_) {}
      navigate('/dashboard');
    } catch (error) {
      if (error.response && error.response.data) {
        if (error.response.data.detail === "No active account found with the given credentials") {
          setErrorMessage("Incorrect email or password. Please try again.");
        } else {
          setErrorMessage(JSON.stringify(error.response.data));
        }
      } else {
        setErrorMessage('Login failed. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: isDark ? theme.palette.background.default : '#f0f7ff',
        transition: 'background 0.3s',
      }}
    >

      <Box textAlign="center" mb={4}>
        <Box display="flex" alignItems="center" justifyContent="center">
          <AttachMoneyIcon sx={{ color: isDark ? theme.palette.primary.light : 'blue', fontSize: 30, marginRight: 1 }} />
          <Typography variant="h5" fontWeight="bold" color={isDark ? 'primary.light' : 'inherit'}>
            BudgetMaster
          </Typography>
        </Box>
        <Typography variant="body1" color={isDark ? 'grey.300' : 'inherit'}>
          Your Personal Finance Tracker
        </Typography>
      </Box>


      <Card
        sx={{
          padding: 4,
          width: '350px',
          borderRadius: 4,
          backgroundColor: isDark ? theme.palette.background.paper : '#fff',
          boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.7)' : 5,
          color: isDark ? 'grey.100' : 'inherit',
          transition: 'background 0.3s, color 0.3s',
        }}
        elevation={isDark ? 0 : 5}
      >
        {errorMessage && (
          <Typography variant="body2" color="error" gutterBottom textAlign="center">
            {errorMessage}
          </Typography>
        )}
        <Typography variant="h6" gutterBottom textAlign="center" color={isDark ? 'grey.100' : 'inherit'}>
          Welcome Back!
        </Typography>
        <Typography variant="body2" gutterBottom textAlign="center" color={isDark ? 'grey.300' : 'inherit'}>
          Enter your signin details to access your account
        </Typography>
        <TextField
          label="Enter Your Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{
            sx: { color: isDark ? 'grey.100' : 'inherit' }
          }}
          InputLabelProps={{
            sx: { color: isDark ? 'grey.300' : 'inherit' }
          }}
        />
        <TextField
          label="Enter Your Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            sx: { color: isDark ? 'grey.100' : 'inherit' }
          }}
          InputLabelProps={{
            sx: { color: isDark ? 'grey.300' : 'inherit' }
          }}
        />
        <Button
          variant="contained"
          fullWidth
          sx={{
            marginTop: 2,
            borderRadius: 4,
            backgroundColor: isDark ? theme.palette.primary.main : undefined,
            color: isDark ? theme.palette.primary.contrastText : undefined,
            '&:hover': {
              backgroundColor: isDark ? theme.palette.primary.dark : undefined,
            },
          }}
          onClick={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            'Sign In'
          )}
        </Button>
        <Typography variant="body2" align="center" mt={2}>
          <Link href="/forgotpassword" color={isDark ? 'primary.light' : 'primary.main'}>
            Forgot Password?
          </Link>
        </Typography>
        <Typography variant="body2" align="center" mt={2}>
          Don't have an account?{' '}
          <Link href="/signup" color={isDark ? 'primary.light' : 'primary.main'}>
            Sign up
          </Link>
        </Typography>
      </Card>

      <Typography variant="body2" mt={4}>
        <Link href="/" color={isDark ? 'primary.light' : 'primary.main'}>
          Back to Home
        </Link>
      </Typography>
    </Box>
  );
}

export default SignInPage;
