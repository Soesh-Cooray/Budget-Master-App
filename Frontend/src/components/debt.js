import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Container,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	Grid,
	IconButton,
	InputAdornment,
	InputLabel,
	LinearProgress,
	MenuItem,
	Paper,
	Select,
	Snackbar,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentsIcon from '@mui/icons-material/Payments';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EventIcon from '@mui/icons-material/Event';
import NotesIcon from '@mui/icons-material/Notes';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { debtAPI, getCurrencySymbol } from '../api';

const emptyDebtForm = {
	title: '',
	person: '',
	type: 'i_owe',
	totalAmount: '',
	paidAmount: '0',
	dueDate: '',
	notes: '',
	reason: '',
};

function getStatus(debt) {
	const remaining = Math.max(Number(debt.totalAmount) - Number(debt.paidAmount), 0);
	if (remaining <= 0) {
		return 'paid';
	}

	if (debt.dueDate) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const due = new Date(debt.dueDate);
		due.setHours(0, 0, 0, 0);
		if (due < today) {
			return 'overdue';
		}
	}

	return 'active';
}

function statusConfig(status) {
	if (status === 'paid') {
		return { label: 'Paid', color: 'success', icon: <CheckCircleOutlineIcon fontSize="small" /> };
	}
	if (status === 'overdue') {
		return { label: 'Overdue', color: 'error', icon: <WarningAmberIcon fontSize="small" /> };
	}
	return { label: 'Active', color: 'warning', icon: <AccessTimeIcon fontSize="small" /> };
}

function formatDate(dateStr) {
	if (!dateStr) return 'N/A';
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

function formatDateTime(dateTimeStr) {
	if (!dateTimeStr) return 'N/A';
	const date = new Date(dateTimeStr);
	return date.toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function DebtPage() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
	const [debts, setDebts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currencySymbol, setCurrencySymbol] = useState(getCurrencySymbol());

	// Filter & search states
	const [searchQuery, setSearchQuery] = useState('');
	const [typeFilter, setTypeFilter] = useState('all'); // all, i_owe, owed_to_me, overdue, paid
	const [sortBy, setSortBy] = useState('newest'); // newest, due_date, amount_desc, amount_asc

	// Create / Edit modal state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingDebt, setEditingDebt] = useState(null);
	const [form, setForm] = useState(emptyDebtForm);
	const [formError, setFormError] = useState('');

	// Quick Payment modal state
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [selectedDebtForPayment, setSelectedDebtForPayment] = useState(null);
	const [paymentAmount, setPaymentAmount] = useState('');
	const [paymentReason, setPaymentReason] = useState('');
	const [paymentError, setPaymentError] = useState('');

	// Version History modal state
	const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
	const [selectedDebtForHistory, setSelectedDebtForHistory] = useState(null);
	const [historyRecords, setHistoryRecords] = useState([]);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [historyError, setHistoryError] = useState('');

	// Snackbar state
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		severity: 'success',
	});

	const mapApiDebtToUi = (item) => ({
		id: item.id,
		title: item.title,
		person: item.person,
		type: item.type,
		totalAmount: Number(item.total_amount),
		paidAmount: Number(item.paid_amount),
		dueDate: item.due_date,
		notes: item.notes || '',
		historyCount: item.history_count || 0,
		createdAt: item.created_at,
		updatedAt: item.updated_at,
	});

	const fetchDebts = useCallback(async () => {
		try {
			setLoading(true);
			const response = await debtAPI.getAll();
			setDebts((response.data || []).map(mapApiDebtToUi));
		} catch (error) {
			console.error('Failed to fetch debts:', error);
			setSnackbar({
				open: true,
				message: 'Failed to load debts.',
				severity: 'error',
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDebts();
	}, [fetchDebts]);

	useEffect(() => {
		const updateCurrency = () => setCurrencySymbol(getCurrencySymbol());
		window.addEventListener('currencyChange', updateCurrency);
		return () => window.removeEventListener('currencyChange', updateCurrency);
	}, []);

	// Summary statistics
	const summary = useMemo(() => {
		return debts.reduce(
			(acc, debt) => {
				const remaining = Math.max(Number(debt.totalAmount) - Number(debt.paidAmount), 0);
				if (debt.type === 'i_owe') {
					acc.iOwe += remaining;
					acc.totalIOwe += Number(debt.totalAmount);
					acc.totalPaidIOwe += Number(debt.paidAmount);
				} else {
					acc.owedToMe += remaining;
					acc.totalOwedToMe += Number(debt.totalAmount);
					acc.totalReceivedOwed += Number(debt.paidAmount);
				}
				if (getStatus(debt) === 'overdue') {
					acc.overdueCount += 1;
				}
				if (getStatus(debt) === 'active') {
					acc.activeCount += 1;
				}
				return acc;
			},
			{
				iOwe: 0,
				owedToMe: 0,
				totalIOwe: 0,
				totalPaidIOwe: 0,
				totalOwedToMe: 0,
				totalReceivedOwed: 0,
				overdueCount: 0,
				activeCount: 0,
			}
		);
	}, [debts]);

	const netPosition = summary.owedToMe - summary.iOwe;

	// Filtered & sorted debts
	const filteredDebts = useMemo(() => {
		return debts
			.filter((debt) => {
				// Search query
				const query = searchQuery.trim().toLowerCase();
				if (query) {
					const matchTitle = debt.title.toLowerCase().includes(query);
					const matchPerson = debt.person.toLowerCase().includes(query);
					const matchNotes = debt.notes.toLowerCase().includes(query);
					if (!matchTitle && !matchPerson && !matchNotes) {
						return false;
					}
				}

				// Type filter
				if (typeFilter === 'i_owe' && debt.type !== 'i_owe') return false;
				if (typeFilter === 'owed_to_me' && debt.type !== 'owed_to_me') return false;
				if (typeFilter === 'overdue' && getStatus(debt) !== 'overdue') return false;
				if (typeFilter === 'paid' && getStatus(debt) !== 'paid') return false;
				if (typeFilter === 'active' && getStatus(debt) !== 'active') return false;

				return true;
			})
			.sort((a, b) => {
				if (sortBy === 'newest') {
					return new Date(b.createdAt) - new Date(a.createdAt);
				}
				if (sortBy === 'due_date') {
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate) - new Date(b.dueDate);
				}
				if (sortBy === 'amount_desc') {
					return b.totalAmount - a.totalAmount;
				}
				if (sortBy === 'amount_asc') {
					return a.totalAmount - b.totalAmount;
				}
				return 0;
			});
	}, [debts, searchQuery, typeFilter, sortBy]);

	// Check if amounts have changed in editing mode to enforce mandatory reason
	const isAmountModified = useMemo(() => {
		if (!editingDebt) return false;
		const originalTotal = Number(editingDebt.totalAmount);
		const originalPaid = Number(editingDebt.paidAmount);
		const currentTotal = Number(form.totalAmount);
		const currentPaid = Number(form.paidAmount);

		return originalTotal !== currentTotal || originalPaid !== currentPaid;
	}, [editingDebt, form.totalAmount, form.paidAmount]);

	const resetForm = () => {
		setForm(emptyDebtForm);
		setEditingDebt(null);
		setFormError('');
	};

	const openCreateDialog = () => {
		resetForm();
		setDialogOpen(true);
	};

	const openEditDialog = (debt) => {
		setEditingDebt(debt);
		setForm({
			title: debt.title,
			person: debt.person,
			type: debt.type,
			totalAmount: String(debt.totalAmount),
			paidAmount: String(debt.paidAmount),
			dueDate: debt.dueDate || '',
			notes: debt.notes || '',
			reason: '',
		});
		setFormError('');
		setDialogOpen(true);
	};

	const closeDialog = () => {
		setDialogOpen(false);
		resetForm();
	};

	const handleFormChange = (field) => (event) => {
		setForm((prev) => ({ ...prev, [field]: event.target.value }));
	};

	const validateDebtForm = () => {
		const total = Number(form.totalAmount);
		const paid = Number(form.paidAmount || 0);

		if (!form.title.trim()) {
			return 'Debt title is required.';
		}
		if (!form.person.trim()) {
			return 'Person or entity name is required.';
		}
		if (!Number.isFinite(total) || total <= 0) {
			return 'Total amount must be greater than 0.';
		}
		if (!Number.isFinite(paid) || paid < 0) {
			return 'Paid amount cannot be negative.';
		}
		if (paid > total) {
			return 'Paid amount cannot be greater than total amount.';
		}

		// MANDATORY Reason for Change when updating total or paid amount
		if (editingDebt && isAmountModified && !form.reason.trim()) {
			return 'Reason for amount change is mandatory.';
		}

		return '';
	};

	const handleSaveDebt = async () => {
		const validationError = validateDebtForm();
		if (validationError) {
			setFormError(validationError);
			return;
		}

		const payload = {
			title: form.title.trim(),
			person: form.person.trim(),
			type: form.type,
			total_amount: Number(form.totalAmount),
			paid_amount: Number(form.paidAmount || 0),
			due_date: form.dueDate || null,
			notes: form.notes.trim(),
			reason: form.reason.trim(),
		};

		try {
			if (editingDebt) {
				const response = await debtAPI.update(editingDebt.id, payload);
				const updatedDebt = mapApiDebtToUi(response.data);
				setDebts((prev) => prev.map((item) => (item.id === editingDebt.id ? updatedDebt : item)));
				setSnackbar({ open: true, message: 'Debt updated with change reason recorded.', severity: 'success' });
			} else {
				const response = await debtAPI.create(payload);
				setDebts((prev) => [mapApiDebtToUi(response.data), ...prev]);
				setSnackbar({ open: true, message: 'New debt recorded successfully.', severity: 'success' });
			}

			closeDialog();
		} catch (error) {
			console.error('Failed to save debt:', error);
			const apiError = error?.response?.data;
			if (apiError && typeof apiError === 'object') {
				const firstKey = Object.keys(apiError)[0];
				const firstMessage = Array.isArray(apiError[firstKey]) ? apiError[firstKey][0] : apiError[firstKey];
				setFormError(String(firstMessage));
			} else {
				setFormError('Failed to save debt. Please try again.');
			}
		}
	};

	const handleDeleteDebt = async (id) => {
		const hasConfirmed = window.confirm('Are you sure you want to delete this debt record?');
		if (!hasConfirmed) {
			return;
		}

		try {
			await debtAPI.delete(id);
			setDebts((prev) => prev.filter((item) => item.id !== id));
			setSnackbar({ open: true, message: 'Debt deleted successfully.', severity: 'info' });
		} catch (error) {
			console.error('Failed to delete debt:', error);
			setSnackbar({ open: true, message: 'Failed to delete debt.', severity: 'error' });
		}
	};

	// Quick payment handlers
	const openPaymentDialog = (debt) => {
		setSelectedDebtForPayment(debt);
		setPaymentAmount('');
		setPaymentReason('');
		setPaymentError('');
		setPaymentDialogOpen(true);
	};

	const closePaymentDialog = () => {
		setPaymentDialogOpen(false);
		setSelectedDebtForPayment(null);
		setPaymentAmount('');
		setPaymentReason('');
		setPaymentError('');
	};

	const handleApplyPayment = async () => {
		if (!selectedDebtForPayment) {
			return;
		}

		const amount = Number(paymentAmount);
		if (!Number.isFinite(amount) || amount <= 0) {
			setPaymentError('Enter a valid amount greater than 0.');
			return;
		}

		const remaining = Math.max(
			Number(selectedDebtForPayment.totalAmount) - Number(selectedDebtForPayment.paidAmount),
			0
		);
		if (amount > remaining) {
			setPaymentError('Payment cannot exceed the remaining balance.');
			return;
		}

		// MANDATORY Reason for Payment
		if (!paymentReason.trim()) {
			setPaymentError('Reason/description for this payment is mandatory.');
			return;
		}

		try {
			const payload = {
				title: selectedDebtForPayment.title,
				person: selectedDebtForPayment.person,
				type: selectedDebtForPayment.type,
				total_amount: Number(selectedDebtForPayment.totalAmount),
				paid_amount: Number(selectedDebtForPayment.paidAmount) + amount,
				due_date: selectedDebtForPayment.dueDate || null,
				notes: selectedDebtForPayment.notes || '',
				reason: paymentReason.trim(),
			};

			const response = await debtAPI.update(selectedDebtForPayment.id, payload);
			const updatedDebt = mapApiDebtToUi(response.data);
			setDebts((prev) =>
				prev.map((item) =>
					item.id === selectedDebtForPayment.id ? updatedDebt : item
				)
			);

			closePaymentDialog();
			setSnackbar({ open: true, message: 'Payment applied and version history logged.', severity: 'success' });
		} catch (error) {
			console.error('Failed to update payment:', error);
			setPaymentError('Failed to apply payment. Please try again.');
		}
	};

	// Version History dialog handlers
	const openHistoryDialog = async (debt) => {
		setSelectedDebtForHistory(debt);
		setHistoryRecords([]);
		setHistoryError('');
		setHistoryDialogOpen(true);
		setLoadingHistory(true);

		try {
			const response = await debtAPI.getHistory(debt.id);
			setHistoryRecords(response.data || []);
		} catch (error) {
			console.error('Failed to fetch debt history:', error);
			setHistoryError('Failed to load version history.');
		} finally {
			setLoadingHistory(false);
		}
	};

	const closeHistoryDialog = () => {
		setHistoryDialogOpen(false);
		setSelectedDebtForHistory(null);
		setHistoryRecords([]);
	};

	const handleCloseSnackbar = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	return (
		<Container
			maxWidth="xl"
			sx={{
				pt: { xs: 2, sm: 3, md: 4 },
				pb: { xs: 12, sm: 6, md: 6 },
				px: { xs: 1.5, sm: 2, md: 3 },
				minHeight: '100vh',
				maxWidth: '100%',
				overflowX: 'hidden',
				boxSizing: 'border-box',
			}}
		>
			{/* Page Header */}
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems={{ xs: 'flex-start', sm: 'center' }}
				flexDirection={{ xs: 'column', sm: 'row' }}
				mb={3.5}
				gap={2}
				sx={{
					p: { xs: 2, sm: 2.5, md: 3.5 },
					borderRadius: 4,
					border: `1px solid ${theme.palette.divider}`,
					background: theme.palette.mode === 'dark'
						? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.6))'
						: 'linear-gradient(135deg, #f0fdf4, #eff6ff)',
					boxShadow: theme.palette.mode === 'dark'
						? '0 12px 30px rgba(0,0,0,0.4)'
						: '0 12px 28px rgba(34, 67, 115, 0.08)',
					width: '100%',
					boxSizing: 'border-box',
				}}
			>
				<Box sx={{ minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
					<Box display="flex" alignItems="center" flexWrap="wrap" gap={1} mb={0.5}>
						<Typography
							variant="h4"
							sx={{
								fontWeight: 800,
								fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' },
								color: theme.palette.text.primary,
								wordBreak: 'break-word',
							}}
						>
							Debt Management
						</Typography>
						<Chip
							label="Audit Tracked"
							size="small"
							color="primary"
							variant="outlined"
							sx={{ fontWeight: 600, borderRadius: 1.5 }}
						/>
					</Box>
					<Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
						Track loans, receivables, repayments, and complete change audit histories.
					</Typography>
				</Box>

				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={openCreateDialog}
					sx={{
						borderRadius: 3,
						px: 3,
						py: 1.2,
						fontWeight: 700,
						fontSize: '0.95rem',
						background: 'linear-gradient(135deg, #16a34a, #0d9488)',
						boxShadow: '0 4px 16px rgba(22, 163, 74, 0.35)',
						textTransform: 'none',
						width: { xs: '100%', sm: 'auto' },
						flexShrink: 0,
						transition: 'all 0.25s ease',
						'&:hover': {
							background: 'linear-gradient(135deg, #15803d, #0f766e)',
							boxShadow: '0 6px 20px rgba(22, 163, 74, 0.5)',
							transform: 'translateY(-1px)',
						},
					}}
				>
					New Debt Record
				</Button>
			</Box>

			{/* Metric Summary Cards */}
			<Box sx={{ width: '100%', overflow: 'hidden', mb: 3.5 }}>
				<Grid container spacing={{ xs: 1.5, sm: 2, lg: 2.5 }}>
					{/* I Owe */}
					<Grid item xs={12} sm={6} lg={3}>
						<Paper
							sx={{
								p: { xs: 2, sm: 2.5, md: 2.8 },
								borderRadius: 3.5,
								height: '100%',
								border: `1px solid ${theme.palette.divider}`,
								background: theme.palette.mode === 'dark'
									? 'linear-gradient(145deg, rgba(239, 68, 68, 0.1), rgba(15, 23, 42, 0.4))'
									: 'linear-gradient(145deg, #fff5f5, #ffffff)',
								boxShadow: theme.palette.mode === 'dark'
									? '0 8px 24px rgba(0,0,0,0.35)'
									: '0 8px 20px rgba(239, 68, 68, 0.08)',
								position: 'relative',
								overflow: 'hidden',
								boxSizing: 'border-box',
							}}
						>
						<Box display="flex" justifyContent="space-between" alignItems="flex-start">
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
									I Owe (Remaining)
								</Typography>
								<Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#ef4444' }}>
									{currencySymbol}{summary.iOwe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</Typography>
							</Box>
							<Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', width: 48, height: 48 }}>
								<TrendingDownIcon />
							</Avatar>
						</Box>
						<Box mt={2}>
							<Typography variant="caption" color="text.secondary">
								Total Borrowed: {currencySymbol}{summary.totalIOwe.toFixed(2)} | Paid: {currencySymbol}{summary.totalPaidIOwe.toFixed(2)}
							</Typography>
						</Box>
					</Paper>
				</Grid>

				{/* Owed To Me */}
				<Grid item xs={12} sm={6} lg={3}>
					<Paper
						sx={{
							p: 2.8,
							borderRadius: 3.5,
							height: '100%',
							border: `1px solid ${theme.palette.divider}`,
							background: theme.palette.mode === 'dark'
								? 'linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(15, 23, 42, 0.4))'
								: 'linear-gradient(145deg, #f0fdf4, #ffffff)',
							boxShadow: theme.palette.mode === 'dark'
								? '0 8px 24px rgba(0,0,0,0.35)'
								: '0 8px 20px rgba(16, 185, 129, 0.08)',
						}}
					>
						<Box display="flex" justifyContent="space-between" alignItems="flex-start">
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
									Owed To Me (Remaining)
								</Typography>
								<Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#10b981' }}>
									{currencySymbol}{summary.owedToMe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</Typography>
							</Box>
							<Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', width: 48, height: 48 }}>
								<TrendingUpIcon />
							</Avatar>
						</Box>
						<Box mt={2}>
							<Typography variant="caption" color="text.secondary">
								Total Lent: {currencySymbol}{summary.totalOwedToMe.toFixed(2)} | Received: {currencySymbol}{summary.totalReceivedOwed.toFixed(2)}
							</Typography>
						</Box>
					</Paper>
				</Grid>

				{/* Net Balance */}
				<Grid item xs={12} sm={6} lg={3}>
					<Paper
						sx={{
							p: 2.8,
							borderRadius: 3.5,
							height: '100%',
							border: `1px solid ${theme.palette.divider}`,
							background: theme.palette.mode === 'dark'
								? 'linear-gradient(145deg, rgba(59, 130, 246, 0.1), rgba(15, 23, 42, 0.4))'
								: 'linear-gradient(145deg, #eff6ff, #ffffff)',
							boxShadow: theme.palette.mode === 'dark'
								? '0 8px 24px rgba(0,0,0,0.35)'
								: '0 8px 20px rgba(59, 130, 246, 0.08)',
						}}
					>
						<Box display="flex" justifyContent="space-between" alignItems="flex-start">
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
									Net Debt Position
								</Typography>
								<Typography
									variant="h4"
									sx={{
										fontWeight: 800,
										mt: 1,
										color: netPosition >= 0 ? '#10b981' : '#ef4444',
									}}
								>
									{netPosition >= 0 ? '+' : ''}{currencySymbol}{netPosition.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</Typography>
							</Box>
							<Avatar sx={{ bgcolor: netPosition >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: netPosition >= 0 ? '#10b981' : '#ef4444', width: 48, height: 48 }}>
								<AccountBalanceWalletIcon />
							</Avatar>
						</Box>
						<Box mt={2}>
							<Typography variant="caption" color="text.secondary">
								{netPosition >= 0 ? 'You are in a positive receivable position.' : 'You have a net outstanding liability.'}
							</Typography>
						</Box>
					</Paper>
				</Grid>

				{/* Active & Overdue */}
				<Grid item xs={12} sm={6} lg={3}>
					<Paper
						sx={{
							p: 2.8,
							borderRadius: 3.5,
							height: '100%',
							border: `1px solid ${theme.palette.divider}`,
							background: theme.palette.mode === 'dark'
								? 'linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(15, 23, 42, 0.4))'
								: 'linear-gradient(145deg, #fffbeb, #ffffff)',
							boxShadow: theme.palette.mode === 'dark'
								? '0 8px 24px rgba(0,0,0,0.35)'
								: '0 8px 20px rgba(245, 158, 11, 0.08)',
						}}
					>
						<Box display="flex" justifyContent="space-between" alignItems="flex-start">
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
									Active Records
								</Typography>
								<Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: theme.palette.text.primary }}>
									{summary.activeCount} <Typography component="span" variant="body2" color="text.secondary">active</Typography>
								</Typography>
							</Box>
							<Avatar sx={{ bgcolor: summary.overdueCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: summary.overdueCount > 0 ? '#ef4444' : '#f59e0b', width: 48, height: 48 }}>
								<WarningAmberIcon />
							</Avatar>
						</Box>
						<Box mt={2} display="flex" alignItems="center" gap={1}>
							{summary.overdueCount > 0 ? (
								<Chip
									icon={<WarningAmberIcon />}
									label={`${summary.overdueCount} Overdue`}
									size="small"
									color="error"
									sx={{ fontWeight: 700 }}
								/>
							) : (
								<Chip
									icon={<CheckCircleOutlineIcon />}
									label="All Payments On Track"
									size="small"
									color="success"
									variant="outlined"
									sx={{ fontWeight: 600 }}
								/>
							)}
						</Box>
					</Paper>
				</Grid>
			</Grid>
		</Box>

			{/* Filter, Search & Sorting Bar */}
			<Paper
				sx={{
					p: { xs: 2, sm: 2.5 },
					mb: 3.5,
					borderRadius: 3.5,
					border: `1px solid ${theme.palette.divider}`,
					boxShadow: theme.palette.mode === 'dark'
						? '0 6px 20px rgba(0,0,0,0.3)'
						: '0 6px 18px rgba(34, 67, 115, 0.05)',
					width: '100%',
					boxSizing: 'border-box',
					overflow: 'hidden',
				}}
			>
				<Grid container spacing={1.5} alignItems="center">
					{/* Search input */}
					<Grid item xs={12} md={5}>
						<TextField
							placeholder="Search by title, person, or notes..."
							size="small"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							fullWidth
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon color="action" />
									</InputAdornment>
								),
								endAdornment: searchQuery && (
									<InputAdornment position="end">
										<IconButton size="small" onClick={() => setSearchQuery('')}>
											<CloseIcon fontSize="small" />
										</IconButton>
									</InputAdornment>
								),
							}}
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
						/>
					</Grid>

					{/* Type Filter Chips */}
					<Grid item xs={12} md={5}>
						<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ maxWidth: '100%' }}>
							{[
								{ id: 'all', label: 'All' },
								{ id: 'i_owe', label: 'I Owe' },
								{ id: 'owed_to_me', label: 'Owed To Me' },
								{ id: 'active', label: 'Active' },
								{ id: 'overdue', label: 'Overdue' },
								{ id: 'paid', label: 'Paid' },
							].map((item) => (
								<Chip
									key={item.id}
									label={item.label}
									clickable
									color={typeFilter === item.id ? 'primary' : 'default'}
									variant={typeFilter === item.id ? 'filled' : 'outlined'}
									onClick={() => setTypeFilter(item.id)}
									sx={{
										fontWeight: typeFilter === item.id ? 700 : 500,
										borderRadius: 2,
									}}
								/>
							))}
						</Stack>
					</Grid>

					{/* Sorting */}
					<Grid item xs={12} md={2}>
						<FormControl size="small" fullWidth>
							<InputLabel id="sort-select-label">Sort By</InputLabel>
							<Select
								labelId="sort-select-label"
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								label="Sort By"
								sx={{ borderRadius: 2.5 }}
							>
								<MenuItem value="newest">Newest First</MenuItem>
								<MenuItem value="due_date">Due Date</MenuItem>
								<MenuItem value="amount_desc">Highest Amount</MenuItem>
								<MenuItem value="amount_asc">Lowest Amount</MenuItem>
							</Select>
						</FormControl>
					</Grid>
				</Grid>
			</Paper>

			{/* Loading State */}
			{loading ? (
				<Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10}>
					<CircularProgress size={48} thickness={4} />
					<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
						Loading debt records...
					</Typography>
				</Box>
			) : filteredDebts.length === 0 ? (
				/* Empty State */
				<Paper
					sx={{
						py: 8,
						px: 3,
						borderRadius: 4,
						textAlign: 'center',
						border: `1px solid ${theme.palette.divider}`,
						background: theme.palette.mode === 'dark'
							? 'rgba(255, 255, 255, 0.02)'
							: 'rgba(255, 255, 255, 0.6)',
						boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
						width: '100%',
						boxSizing: 'border-box',
						overflow: 'hidden',
					}}
				>
					<Stack spacing={2} alignItems="center" maxWidth={420} mx="auto">
						<Box
							sx={{
								width: 72,
								height: 72,
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
							}}
						>
							<CreditCardIcon sx={{ fontSize: 36, color: 'text.secondary' }} />
						</Box>
						<Typography variant="h5" fontWeight={700}>
							{searchQuery || typeFilter !== 'all' ? 'No matching debts found' : 'No debts added yet'}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{searchQuery || typeFilter !== 'all'
								? 'Try adjusting your search terms or filter selection to find records.'
								: 'Start tracking loans, borrowings, repayments, and version history records today.'}
						</Typography>
						<Button
							variant="contained"
							onClick={openCreateDialog}
							startIcon={<AddIcon />}
							sx={{ borderRadius: 2.5, px: 3, textTransform: 'none', fontWeight: 600 }}
						>
							Create First Debt
						</Button>
					</Stack>
				</Paper>
			) : isMobile ? (
				/* Mobile View: Enhanced Glassmorphic Cards */
				<Stack spacing={2} sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
					{filteredDebts.map((debt) => {
						const remaining = Math.max(debt.totalAmount - debt.paidAmount, 0);
						const percentPaid = debt.totalAmount > 0 ? Math.min((debt.paidAmount / debt.totalAmount) * 100, 100) : 0;
						const status = getStatus(debt);
						const config = statusConfig(status);

						return (
							<Paper
								key={debt.id}
								sx={{
									p: { xs: 2, sm: 2.5 },
									borderRadius: 3.5,
									border: `1px solid ${theme.palette.divider}`,
									background: theme.palette.mode === 'dark'
										? 'linear-gradient(145deg, rgba(30, 41, 59, 0.45), rgba(15, 23, 42, 0.4))'
										: '#ffffff',
									boxShadow: theme.palette.mode === 'dark'
										? '0 10px 24px rgba(0,0,0,0.35)'
										: '0 8px 22px rgba(34, 67, 115, 0.08)',
									width: '100%',
									maxWidth: '100%',
									boxSizing: 'border-box',
									overflow: 'hidden',
								}}
							>
								{/* Header row: title + remaining amount */}
								<Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} gap={1}>
									<Box sx={{ pr: 1, minWidth: 0, flex: 1 }}>
										<Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.3, wordBreak: 'break-word' }}>
											{debt.title}
										</Typography>
										<Box display="flex" alignItems="center" gap={0.5} mt={0.3}>
											<PersonOutlineIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16, flexShrink: 0 }} />
											<Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
												{debt.person}
											</Typography>
										</Box>
									</Box>
									<Box textAlign="right" sx={{ flexShrink: 0 }}>
										<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
											Remaining
										</Typography>
										<Typography
											variant="h6"
											sx={{
												fontWeight: 800,
												color: debt.type === 'i_owe' ? '#ef4444' : '#10b981',
												whiteSpace: 'nowrap',
											}}
										>
											{currencySymbol}{remaining.toFixed(2)}
										</Typography>
									</Box>
								</Box>

								{/* Chips row: Type, Status, Due date */}
								<Box display="flex" alignItems="center" flexWrap="wrap" gap={0.75} mb={2} mt={1} sx={{ maxWidth: '100%' }}>
									<Chip
										label={debt.type === 'i_owe' ? 'I Owe' : 'Owed To Me'}
										size="small"
										color={debt.type === 'i_owe' ? 'error' : 'success'}
										variant={debt.type === 'i_owe' ? 'outlined' : 'filled'}
										sx={{ fontWeight: 700, borderRadius: 1.5 }}
									/>
									<Chip
										icon={config.icon}
										label={config.label}
										size="small"
										color={config.color}
										sx={{ fontWeight: 600, borderRadius: 1.5 }}
									/>
									{debt.dueDate && (
										<Chip
											icon={<EventIcon fontSize="small" />}
											label={`Due: ${formatDate(debt.dueDate)}`}
											size="small"
											variant="outlined"
											sx={{ borderRadius: 1.5 }}
										/>
									)}
								</Box>

								{/* Progress Bar & Amounts */}
								<Box mb={2}>
									<Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={0.5} mb={0.5}>
										<Typography variant="caption" color="text.secondary">
											Paid: <strong>{currencySymbol}{debt.paidAmount.toFixed(2)}</strong> ({percentPaid.toFixed(1)}%)
										</Typography>
										<Typography variant="caption" color="text.secondary">
											Total: <strong>{currencySymbol}{debt.totalAmount.toFixed(2)}</strong>
										</Typography>
									</Box>
									<LinearProgress
										variant="determinate"
										value={percentPaid}
										sx={{
											height: 8,
											borderRadius: 4,
											bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
											'& .MuiLinearProgress-bar': {
												borderRadius: 4,
												background: debt.type === 'i_owe'
													? 'linear-gradient(90deg, #f87171, #ef4444)'
													: 'linear-gradient(90deg, #34d399, #10b981)',
											},
										}}
									/>
								</Box>

								{/* Notes section if present */}
								{debt.notes && (
									<Box
										sx={{
											p: 1.5,
											mb: 2,
											borderRadius: 2,
											bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
											borderLeft: `3px solid ${theme.palette.primary.main}`,
											overflow: 'hidden',
											wordBreak: 'break-word',
										}}
									>
										<Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
											<NotesIcon fontSize="small" sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
											<Typography variant="caption" fontWeight={700} color="text.secondary">
												Notes:
											</Typography>
										</Box>
										<Typography variant="body2" sx={{ fontStyle: 'italic', wordBreak: 'break-word' }}>
											{debt.notes}
										</Typography>
									</Box>
								)}

								{/* Footer row: Date Created & Actions */}
								<Divider sx={{ my: 1.5 }} />
								<Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
									<Box display="flex" alignItems="center" gap={0.5} sx={{ minWidth: 0 }}>
										<AccessTimeIcon sx={{ fontSize: 15, color: 'text.secondary', flexShrink: 0 }} />
										<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
											Created: {formatDate(debt.createdAt)}
										</Typography>
									</Box>

									<Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
										{remaining > 0 && (
											<Button
												size="small"
												variant="contained"
												color="success"
												startIcon={<PaymentsIcon />}
												onClick={() => openPaymentDialog(debt)}
												sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 0.5 }}
											>
												Pay
											</Button>
										)}

										<Tooltip title="View Version History">
											<IconButton
												size="small"
												onClick={() => openHistoryDialog(debt)}
												sx={{
													border: `1px solid ${theme.palette.divider}`,
													borderRadius: 2,
													color: theme.palette.primary.main,
												}}
											>
												<HistoryIcon fontSize="small" />
											</IconButton>
										</Tooltip>

										<Tooltip title="Edit Record">
											<IconButton
												size="small"
												onClick={() => openEditDialog(debt)}
												sx={{
													border: `1px solid ${theme.palette.divider}`,
													borderRadius: 2,
												}}
											>
												<EditIcon fontSize="small" />
											</IconButton>
										</Tooltip>

										<Tooltip title="Delete Record">
											<IconButton
												size="small"
												color="error"
												onClick={() => handleDeleteDebt(debt.id)}
												sx={{
													border: `1px solid ${theme.palette.divider}`,
													borderRadius: 2,
												}}
											>
												<DeleteIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									</Box>
								</Box>
							</Paper>
						);
					})}
				</Stack>
			) : (
				/* Desktop View: Sleek Modern Table with Expanded Cards */
				<TableContainer
					component={Paper}
					sx={{
						borderRadius: 4,
						border: `1px solid ${theme.palette.divider}`,
						background: theme.palette.mode === 'dark'
							? 'linear-gradient(180deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.3))'
							: 'linear-gradient(180deg, #ffffff, #f8fbff)',
						boxShadow: theme.palette.mode === 'dark'
							? '0 12px 32px rgba(0,0,0,0.4)'
							: '0 12px 30px rgba(34, 67, 115, 0.1)',
					}}
				>
					<Table sx={{ minWidth: 850 }}>
						<TableHead>
							<TableRow
								sx={{
									'& th': {
										fontWeight: 700,
										color: theme.palette.text.secondary,
										backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
										borderBottom: `1px solid ${theme.palette.divider}`,
										py: 2,
									},
								}}
							>
								<TableCell>Debt Details</TableCell>
								<TableCell>Type</TableCell>
								<TableCell>Repayment Progress</TableCell>
								<TableCell>Remaining</TableCell>
								<TableCell>Due Date</TableCell>
								<TableCell>Created Date</TableCell>
								<TableCell>Notes</TableCell>
								<TableCell align="right">Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredDebts.map((debt) => {
								const remaining = Math.max(debt.totalAmount - debt.paidAmount, 0);
								const percentPaid = debt.totalAmount > 0 ? Math.min((debt.paidAmount / debt.totalAmount) * 100, 100) : 0;
								const status = getStatus(debt);
								const config = statusConfig(status);

								return (
									<TableRow
										key={debt.id}
										hover
										sx={{
											transition: 'background-color 0.2s ease',
											'& td': {
												py: 2.2,
												borderBottom: `1px solid ${theme.palette.divider}`,
											},
											'&:last-child td': { borderBottom: 0 },
										}}
									>
										{/* Debt Details */}
										<TableCell>
											<Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
												{debt.title}
											</Typography>
											<Box display="flex" alignItems="center" gap={0.5} mt={0.2}>
												<PersonOutlineIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
												<Typography variant="body2" color="text.secondary">
													{debt.person}
												</Typography>
											</Box>
										</TableCell>

										{/* Type & Status */}
										<TableCell>
											<Stack spacing={0.8} alignItems="flex-start">
												<Chip
													label={debt.type === 'i_owe' ? 'I Owe' : 'Owed To Me'}
													size="small"
													color={debt.type === 'i_owe' ? 'error' : 'success'}
													variant={debt.type === 'i_owe' ? 'outlined' : 'filled'}
													sx={{ fontWeight: 700, borderRadius: 1.5 }}
												/>
												<Chip
													icon={config.icon}
													label={config.label}
													size="small"
													color={config.color}
													sx={{ fontWeight: 600, borderRadius: 1.5 }}
												/>
											</Stack>
										</TableCell>

										{/* Repayment Progress */}
										<TableCell sx={{ minWidth: 180 }}>
											<Box display="flex" justifyContent="space-between" mb={0.5}>
												<Typography variant="caption" fontWeight={600}>
													{currencySymbol}{debt.paidAmount.toFixed(2)}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													of {currencySymbol}{debt.totalAmount.toFixed(2)} ({percentPaid.toFixed(0)}%)
												</Typography>
											</Box>
											<LinearProgress
												variant="determinate"
												value={percentPaid}
												sx={{
													height: 6,
													borderRadius: 3,
													bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
													'& .MuiLinearProgress-bar': {
														borderRadius: 3,
														background: debt.type === 'i_owe'
															? 'linear-gradient(90deg, #f87171, #ef4444)'
															: 'linear-gradient(90deg, #34d399, #10b981)',
													},
												}}
											/>
										</TableCell>

										{/* Remaining */}
										<TableCell>
											<Typography
												variant="body2"
												sx={{
													fontWeight: 800,
													color: debt.type === 'i_owe' ? '#ef4444' : '#10b981',
													fontSize: '1rem',
												}}
											>
												{currencySymbol}{remaining.toFixed(2)}
											</Typography>
										</TableCell>

										{/* Due Date */}
										<TableCell>
											<Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
												{debt.dueDate ? formatDate(debt.dueDate) : <span style={{ color: '#888' }}>No due date</span>}
											</Typography>
										</TableCell>

										{/* Created Date */}
										<TableCell>
											<Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
												{formatDate(debt.createdAt)}
											</Typography>
										</TableCell>

										{/* Notes */}
										<TableCell sx={{ maxWidth: 200 }}>
											{debt.notes ? (
												<Tooltip title={debt.notes} arrow placement="top">
													<Typography
														variant="body2"
														color="text.secondary"
														sx={{
															display: '-webkit-box',
															WebkitLineClamp: 2,
															WebkitBoxOrient: 'vertical',
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															cursor: 'help',
														}}
													>
														{debt.notes}
													</Typography>
												</Tooltip>
											) : (
												<Typography variant="caption" color="text.disabled">—</Typography>
											)}
										</TableCell>

										{/* Actions */}
										<TableCell align="right">
											<Stack direction="row" spacing={0.5} justifyContent="flex-end">
												{remaining > 0 && (
													<Tooltip title="Update Payment">
														<IconButton
															color="success"
															size="small"
															onClick={() => openPaymentDialog(debt)}
															sx={{
																bgcolor: 'rgba(16, 185, 129, 0.1)',
																'&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' },
															}}
														>
															<PaymentsIcon fontSize="small" />
														</IconButton>
													</Tooltip>
												)}

												<Tooltip title="View Version History">
													<IconButton
														color="primary"
														size="small"
														onClick={() => openHistoryDialog(debt)}
														sx={{
															bgcolor: 'rgba(59, 130, 246, 0.1)',
															'&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' },
														}}
													>
														<HistoryIcon fontSize="small" />
													</IconButton>
												</Tooltip>

												<Tooltip title="Edit Debt">
													<IconButton
														size="small"
														onClick={() => openEditDialog(debt)}
														sx={{
															bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
														}}
													>
														<EditIcon fontSize="small" />
													</IconButton>
												</Tooltip>

												<Tooltip title="Delete Debt">
													<IconButton
														color="error"
														size="small"
														onClick={() => handleDeleteDebt(debt.id)}
														sx={{
															bgcolor: 'rgba(239, 68, 68, 0.1)',
															'&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
														}}
													>
														<DeleteIcon fontSize="small" />
													</IconButton>
												</Tooltip>
											</Stack>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			{/* Create / Edit Debt Dialog */}
			<Dialog
				open={dialogOpen}
				onClose={closeDialog}
				maxWidth="sm"
				fullWidth
				fullScreen={isSmallScreen}
				PaperProps={{
					sx: {
						borderRadius: isSmallScreen ? 0 : 4,
						p: 1,
					},
				}}
			>
				<DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
					{editingDebt ? 'Edit Debt Record' : 'Add New Debt'}
					<Typography variant="body2" color="text.secondary">
						{editingDebt
							? 'Modifying total or paid amount requires a mandatory explanation for version tracking.'
							: 'Fill in the debt details below. An initial creation history will be recorded.'}
					</Typography>
				</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={2.5} sx={{ mt: 1 }}>
						{!!formError && <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>}

						<TextField
							label="Debt Title"
							placeholder="e.g. Car Loan, Dinner with Alex, Freelance Advance"
							value={form.title}
							onChange={handleFormChange('title')}
							fullWidth
							required
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
						/>

						<Grid container spacing={2}>
							<Grid item xs={12} sm={6}>
								<TextField
									label="Person / Organization"
									placeholder="Who is this debt with?"
									value={form.person}
									onChange={handleFormChange('person')}
									fullWidth
									required
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									select
									label="Debt Type"
									value={form.type}
									onChange={handleFormChange('type')}
									fullWidth
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
								>
									<MenuItem value="i_owe">I Owe (Liability)</MenuItem>
									<MenuItem value="owed_to_me">Owed To Me (Receivable)</MenuItem>
								</TextField>
							</Grid>
						</Grid>

						<Grid container spacing={2}>
							<Grid item xs={12} sm={6}>
								<TextField
									label="Total Amount"
									type="number"
									inputProps={{ min: 0, step: '0.01' }}
									value={form.totalAmount}
									onChange={handleFormChange('totalAmount')}
									fullWidth
									required
									InputProps={{
										startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
									}}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									label="Paid Amount"
									type="number"
									inputProps={{ min: 0, step: '0.01' }}
									value={form.paidAmount}
									onChange={handleFormChange('paidAmount')}
									fullWidth
									InputProps={{
										startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
									}}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
								/>
							</Grid>
						</Grid>

						<TextField
							label="Due Date (Optional)"
							type="date"
							value={form.dueDate}
							onChange={handleFormChange('dueDate')}
							InputLabelProps={{ shrink: true }}
							fullWidth
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
						/>

						{/* MANDATORY REASON FIELD WHEN EDITING AMOUNTS */}
						{editingDebt && isAmountModified && (
							<Box
								sx={{
									p: 2,
									borderRadius: 2.5,
									bgcolor: theme.palette.mode === 'dark' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(254, 243, 199, 0.6)',
									border: '1px solid rgba(234, 179, 8, 0.4)',
								}}
							>
								<Box display="flex" alignItems="center" gap={1} mb={1}>
									<WarningAmberIcon sx={{ color: '#d97706', fontSize: 20 }} />
									<Typography variant="subtitle2" fontWeight={700} color="#b45309">
										Reason for Amount Change * (Mandatory)
									</Typography>
								</Box>
								<Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
									Because you modified the total or paid amount, please specify the exact reason to record in the version audit history.
								</Typography>
								<TextField
									label="Reason for Change *"
									placeholder="e.g. Paid installment via bank transfer, agreed principal reduction, renegotiated terms"
									value={form.reason}
									onChange={handleFormChange('reason')}
									fullWidth
									required
									error={!form.reason.trim()}
									helperText={!form.reason.trim() ? 'This reason is required and will be logged in the history.' : ''}
									sx={{ bgcolor: theme.palette.background.paper, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
								/>
							</Box>
						)}

						<TextField
							label="Notes / Terms (Visible in record)"
							placeholder="Add any details, account numbers, repayment terms, or notes..."
							value={form.notes}
							onChange={handleFormChange('notes')}
							fullWidth
							multiline
							minRows={3}
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={closeDialog} sx={{ borderRadius: 2, textTransform: 'none' }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSaveDebt}
						disabled={Boolean(editingDebt && isAmountModified && !form.reason.trim())}
						sx={{
							borderRadius: 2.5,
							px: 3,
							fontWeight: 700,
							textTransform: 'none',
						}}
					>
						{editingDebt ? 'Save Changes & Record History' : 'Create Debt Record'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Quick Payment Dialog */}
			<Dialog
				open={paymentDialogOpen}
				onClose={closePaymentDialog}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
			>
				<DialogTitle sx={{ fontWeight: 800 }}>
					Apply Payment
					<Typography variant="body2" color="text.secondary">
						{selectedDebtForPayment?.title} ({selectedDebtForPayment?.person})
					</Typography>
				</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={2.5} sx={{ mt: 1 }}>
						{!!paymentError && <Alert severity="error" sx={{ borderRadius: 2 }}>{paymentError}</Alert>}

						<Box
							sx={{
								p: 2,
								borderRadius: 2.5,
								bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
							}}
						>
							<Box display="flex" justifyContent="space-between" mb={0.5}>
								<Typography variant="caption" color="text.secondary">Total Amount:</Typography>
								<Typography variant="caption" fontWeight={700}>
									{currencySymbol}{selectedDebtForPayment?.totalAmount.toFixed(2)}
								</Typography>
							</Box>
							<Box display="flex" justifyContent="space-between" mb={0.5}>
								<Typography variant="caption" color="text.secondary">Currently Paid:</Typography>
								<Typography variant="caption" fontWeight={700}>
									{currencySymbol}{selectedDebtForPayment?.paidAmount.toFixed(2)}
								</Typography>
							</Box>
							<Divider sx={{ my: 0.5 }} />
							<Box display="flex" justifyContent="space-between">
								<Typography variant="body2" fontWeight={700} color="primary">Remaining Balance:</Typography>
								<Typography variant="body2" fontWeight={800} color="primary">
									{currencySymbol}{Math.max(Number(selectedDebtForPayment?.totalAmount || 0) - Number(selectedDebtForPayment?.paidAmount || 0), 0).toFixed(2)}
								</Typography>
							</Box>
						</Box>

						<TextField
							label="Payment Amount *"
							type="number"
							inputProps={{ min: 0.01, step: '0.01' }}
							value={paymentAmount}
							onChange={(event) => setPaymentAmount(event.target.value)}
							fullWidth
							required
							InputProps={{
								startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
							}}
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
						/>

						<TextField
							label="Payment Reason / Method * (Mandatory)"
							placeholder="e.g. Bank Transfer, Cash payment, Monthly installment #2"
							value={paymentReason}
							onChange={(event) => setPaymentReason(event.target.value)}
							fullWidth
							required
							error={!paymentReason.trim() && !!paymentAmount}
							helperText="Reason is mandatory and will be saved in the version audit log."
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={closePaymentDialog} sx={{ borderRadius: 2, textTransform: 'none' }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						color="success"
						onClick={handleApplyPayment}
						disabled={!paymentAmount || Number(paymentAmount) <= 0 || !paymentReason.trim()}
						sx={{ borderRadius: 2.5, px: 3, fontWeight: 700, textTransform: 'none' }}
					>
						Apply Payment & Log
					</Button>
				</DialogActions>
			</Dialog>

			{/* Version History Dialog */}
			<Dialog
				open={historyDialogOpen}
				onClose={closeHistoryDialog}
				maxWidth="md"
				fullWidth
				fullScreen={isSmallScreen}
				PaperProps={{ sx: { borderRadius: isSmallScreen ? 0 : 4, p: 1 } }}
			>
				<DialogTitle sx={{ pb: 1 }}>
					<Box display="flex" justifyContent="space-between" alignItems="center">
						<Box display="flex" alignItems="center" gap={1.5}>
							<Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
								<HistoryIcon />
							</Avatar>
							<Box>
								<Typography variant="h6" fontWeight={800}>
									Version History & Audit Log
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{selectedDebtForHistory?.title} — {selectedDebtForHistory?.person} ({selectedDebtForHistory?.type === 'i_owe' ? 'I Owe' : 'Owed To Me'})
								</Typography>
							</Box>
						</Box>
						<IconButton onClick={closeHistoryDialog}>
							<CloseIcon />
						</IconButton>
					</Box>
				</DialogTitle>
				<DialogContent dividers>
					{loadingHistory ? (
						<Box display="flex" flexDirection="column" alignItems="center" py={6}>
							<CircularProgress size={40} thickness={4} />
							<Typography variant="body2" color="text.secondary" mt={2}>
								Loading version history...
							</Typography>
						</Box>
					) : historyError ? (
						<Alert severity="error" sx={{ my: 2 }}>{historyError}</Alert>
					) : historyRecords.length === 0 ? (
						<Box textAlign="center" py={6}>
							<Typography variant="body1" color="text.secondary">
								No version history records found for this debt entry.
							</Typography>
						</Box>
					) : (
						<Box sx={{ py: 1 }}>
							<Typography variant="caption" color="text.secondary" display="block" mb={2}>
								Showing all {historyRecords.length} recorded change events in reverse chronological order:
							</Typography>

							<Stack spacing={2.5}>
								{historyRecords.map((record, index) => {
									const isCreation = record.action === 'created';
									const isPayment = record.action === 'payment';

									return (
										<Paper
											key={record.id}
											sx={{
												p: 2.5,
												borderRadius: 3,
												border: `1px solid ${theme.palette.divider}`,
												background: theme.palette.mode === 'dark'
													? 'rgba(255, 255, 255, 0.03)'
													: 'rgba(255, 255, 255, 0.95)',
												boxShadow: theme.palette.mode === 'dark'
													? '0 4px 14px rgba(0,0,0,0.25)'
													: '0 4px 14px rgba(0,0,0,0.04)',
												position: 'relative',
											}}
										>
											{/* Top row: action chip + timestamp */}
											<Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
												<Box display="flex" alignItems="center" gap={1}>
													<Chip
														label={
															isCreation
																? 'Initial Creation'
																: isPayment
																	? 'Payment Added'
																	: 'Amount / Details Changed'
														}
														size="small"
														color={isCreation ? 'info' : isPayment ? 'success' : 'warning'}
														sx={{ fontWeight: 700, borderRadius: 1.5 }}
													/>
													<Typography variant="caption" color="text.secondary">
														Version #{historyRecords.length - index}
													</Typography>
												</Box>

												<Box display="flex" alignItems="center" gap={0.6}>
													<AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
													<Typography variant="body2" fontWeight={600} color="text.secondary">
														{formatDateTime(record.created_at)}
													</Typography>
												</Box>
											</Box>

											{/* Amount Differences Box */}
											<Box
												sx={{
													p: 1.8,
													mb: 1.5,
													borderRadius: 2,
													bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.02)',
													border: `1px solid ${theme.palette.divider}`,
												}}
											>
												{isCreation ? (
													<Grid container spacing={2}>
														<Grid item xs={6}>
															<Typography variant="caption" color="text.secondary">Initial Total Debt:</Typography>
															<Typography variant="body1" fontWeight={700}>
																{currencySymbol}{Number(record.new_total_amount || 0).toFixed(2)}
															</Typography>
														</Grid>
														<Grid item xs={6}>
															<Typography variant="caption" color="text.secondary">Initial Paid Amount:</Typography>
															<Typography variant="body1" fontWeight={700}>
																{currencySymbol}{Number(record.new_paid_amount || 0).toFixed(2)}
															</Typography>
														</Grid>
													</Grid>
												) : (
													<Grid container spacing={2}>
														{/* Paid Amount Change */}
														{record.previous_paid_amount !== record.new_paid_amount && (
															<Grid item xs={12} sm={6}>
																<Typography variant="caption" color="text.secondary">Paid Amount:</Typography>
																<Box display="flex" alignItems="center" gap={1} mt={0.3}>
																	<Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
																		{currencySymbol}{Number(record.previous_paid_amount || 0).toFixed(2)}
																	</Typography>
																	<ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
																	<Typography variant="body1" fontWeight={700} color="#10b981">
																		{currencySymbol}{Number(record.new_paid_amount || 0).toFixed(2)}
																	</Typography>
																	{record.change_amount && isPayment && (
																		<Chip
																			label={`+${currencySymbol}${Number(record.change_amount).toFixed(2)}`}
																			size="small"
																			color="success"
																			sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }}
																		/>
																	)}
																</Box>
															</Grid>
														)}

														{/* Total Amount Change */}
														{record.previous_total_amount !== record.new_total_amount && (
															<Grid item xs={12} sm={6}>
																<Typography variant="caption" color="text.secondary">Total Debt Amount:</Typography>
																<Box display="flex" alignItems="center" gap={1} mt={0.3}>
																	<Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
																		{currencySymbol}{Number(record.previous_total_amount || 0).toFixed(2)}
																	</Typography>
																	<ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
																	<Typography variant="body1" fontWeight={700} color="primary">
																		{currencySymbol}{Number(record.new_total_amount || 0).toFixed(2)}
																	</Typography>
																</Box>
															</Grid>
														)}
													</Grid>
												)}
											</Box>

											{/* Reason For Change */}
											<Box
												sx={{
													p: 1.5,
													borderRadius: 2,
													bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 246, 255, 0.8)',
													borderLeft: '4px solid #3b82f6',
												}}
											>
												<Typography variant="caption" fontWeight={700} color="primary" sx={{ display: 'block', mb: 0.3 }}>
													Reason / Audit Note:
												</Typography>
												<Typography variant="body2" sx={{ fontWeight: 600 }}>
													{record.reason || 'No specific reason entered.'}
												</Typography>
											</Box>

											{/* Snapshot notes if any */}
											{record.notes && (
												<Box mt={1.2}>
													<Typography variant="caption" color="text.secondary">
														<strong>Notes at this point:</strong> {record.notes}
													</Typography>
												</Box>
											)}
										</Paper>
									);
								})}
							</Stack>
						</Box>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={closeHistoryDialog} variant="outlined" sx={{ borderRadius: 2.5, px: 3, textTransform: 'none' }}>
						Close
					</Button>
				</DialogActions>
			</Dialog>

			{/* Global Feedback Snackbar */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={3500}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				<Alert severity={snackbar.severity} onClose={handleCloseSnackbar} sx={{ borderRadius: 2.5, boxShadow: 6 }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Container>
	);
}

export default DebtPage;
