import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Button, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, TablePagination, IconButton, Box,
    Collapse, FormControl, InputLabel, Select, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { assetService } from '../services/assetService';
import AssetDialog from '../components/AssetDialog';
import AssetChart from '../components/AssetChart';

// Row Component for Expandable functionalities
const AssetRow = ({ row, onEdit, onDelete, currentUserId }) => {
    const [open, setOpen] = useState(false);

    const isOwner = row.userId === currentUserId || currentUserId === 'admin'; // Simple check, ideally check role

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.total.toLocaleString()}</TableCell>
                <TableCell>{row.User?.username}</TableCell>
                <TableCell>
                    {isOwner && (
                        <>
                            <IconButton onClick={() => onEdit(row)} size="small" color="primary">
                                <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => onDelete(row)} size="small" color="error">
                                <DeleteIcon />
                            </IconButton>
                        </>
                    )}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Details
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Item</TableCell>
                                        <TableCell align="right">Value</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell component="th" scope="row">
                                                {item.name}
                                            </TableCell>
                                            <TableCell align="right">{item.value.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const AssetPage = () => {
    const [assets, setAssets] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [filterUser, setFilterUser] = useState('');
    const [users, setUsers] = useState([]); // List of users for filter, if needed. For now, we might just assume current user or fetch all if admin.

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser ? currentUser.id : null;
    // NOTE: In a real app we'd fetch the user profile to be sure.

    useEffect(() => {
        fetchAssets();
    }, [page, limit, filterUser]);

    const fetchAssets = async () => {
        try {
            const data = await assetService.list(page + 1, limit, filterUser);
            setAssets(data.data);
            setTotal(data.total);
        } catch (error) {
            console.error(error);
        }
    };

    // Fetch users for filter
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const token = user ? user.token : '';
                const response = await fetch('/api/user/list', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.data);
                    // Set default filter to current user if not already set
                    if (!filterUser && currentUserId) {
                        setFilterUser(currentUserId);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, [currentUserId]);

    const handleCreate = () => {
        setEditData(null);
        setDialogOpen(true);
    };

    const handleEdit = (asset) => {
        setEditData(asset);
        setDialogOpen(true);
    };

    const handleSave = async (data) => {
        if (editData) {
            await assetService.update(editData.id, data);
        } else {
            await assetService.create(data);
        }
        fetchAssets();
    };

    const handleDeleteClick = (asset) => {
        setDeleteTarget(asset);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (deleteTarget) {
            await assetService.delete(deleteTarget.id);
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
            fetchAssets();
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setLimit(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Assets</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                    New Asset
                </Button>
            </Box>

            <AssetChart data={assets} />

            <Paper sx={{ width: '100%', mb: 2 }}>
                {/* Filter */}
                <FormControl sx={{ mb: 2, minWidth: 200 }} size="small">
                    <InputLabel>Filter by User</InputLabel>
                    <Select
                        value={filterUser}
                        label="Filter by User"
                        onChange={(e) => setFilterUser(e.target.value)}
                    >
                        {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                                {user.username}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Date</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assets.map((row) => (
                            <AssetRow
                                key={row.id}
                                row={row}
                                onEdit={handleEdit}
                                onDelete={handleDeleteClick}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </TableBody>
                </Table>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={total}
                    rowsPerPage={limit}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            <AssetDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSave}
                editData={editData}
            />

            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this asset record? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AssetPage;
