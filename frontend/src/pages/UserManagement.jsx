import React, { useState, useEffect } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Chip,
    TextField,
    InputAdornment,
    Switch,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import moment from 'moment';
import api from '../utils/api';
import UserDialog from '../components/UserDialog';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchUsers();
    }, [search]);

    const fetchUsers = async () => {
        try {
            const query = search ? `?keyword=${encodeURIComponent(search)}` : '';
            const res = await api.get(`/api/user/list${query}`);
            if (res.success) {
                setUsers(res.data);
            }
        } catch (err) {
            showSnackbar(err.message, 'error');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleCreate = () => {
        setEditingUser(null);
        setDialogOpen(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setDialogOpen(true);
    };

    const handleSave = async (userData) => {
        try {
            if (userData.id) {
                const res = await api.post('/api/user/update', userData);
                if (res.success) showSnackbar('User updated successfully');
            } else {
                const res = await api.post('/api/user/create', userData);
                if (res.success) showSnackbar('User created successfully');
            }
            setDialogOpen(false);
            fetchUsers();
        } catch (err) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleDelete = async (user) => {
        if (user.status !== 'disabled') {
            showSnackbar('User must be disabled before deletion', 'warning');
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${user.username}?`)) return;

        try {
            const res = await api.post('/api/user/delete', { id: user.id });
            if (res.success) {
                showSnackbar('User deleted');
                fetchUsers();
            }
        } catch (err) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleToggleStatus = async (user) => {
        const newStatus = user.status === 'active' ? 'disabled' : 'active';
        try {
            const res = await api.post('/api/user/change-status', { id: user.id, status: newStatus });
            if (res.success) {
                showSnackbar(`User ${newStatus}`);
                fetchUsers();
            }
        } catch (err) {
            showSnackbar(err.message, 'error');
        }
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Container maxWidth="lg">
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold" color="textPrimary">
                            User Management
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreate}
                            sx={{
                                background: 'linear-gradient(45deg, #1e3c72 30%, #2a5298 90%)',
                                color: 'white',
                                boxShadow: '0 3px 5px 2px rgba(30, 60, 114, .3)',
                            }}
                        >
                            New User
                        </Button>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search users by username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                    </Box>

                    <TableContainer>
                        <Table sx={{ minWidth: 650 }} aria-label="user table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f9f9f9' } }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {user.id}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'medium' }}>{user.username}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.status}
                                                color={user.status === 'active' ? 'success' : 'default'}
                                                size="small"
                                                variant={user.status === 'active' ? 'filled' : 'outlined'}
                                            />
                                        </TableCell>
                                        <TableCell>{moment(user.createdAt).format('YYYY-MM-DD HH:mm')}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={user.username === 'admin' ? '管理者不可停用' : (user.status === 'active' ? 'Disable User' : 'Enable User')}>
                                                <span>
                                                    <Switch
                                                        checked={user.status === 'active'}
                                                        onChange={() => handleToggleStatus(user)}
                                                        disabled={user.username === 'admin'}
                                                        color="success"
                                                        size="small"
                                                    />
                                                </span>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleEdit(user)} size="small" sx={{ mr: 1, color: '#1976d2' }}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={user.username === 'admin' ? '管理者不可刪除' : (user.status === 'active' ? "Disable user to delete" : "Delete")}>
                                                <span>
                                                    <IconButton
                                                        onClick={() => handleDelete(user)}
                                                        size="small"
                                                        disabled={user.status === 'active' || user.username === 'admin'}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                                                No users found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>

            <UserDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSave}
                user={editingUser}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserManagement;

