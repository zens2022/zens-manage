import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, IconButton, Box, Typography,
    Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import moment from 'moment';
import { assetService } from '../services/assetService';

const AssetDialog = ({ open, onClose, onSave, editData }) => {
    const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
    const [items, setItems] = useState([{ name: '', value: '' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setError('');
            if (editData) {
                // Edit mode
                setDate(editData.date);
                setItems(editData.items.map(item => ({ name: item.name, value: item.value })));
            } else {
                // Create mode - load last items
                setDate(moment().format('YYYY-MM-DD'));
                loadLastItems();
            }
        }
    }, [open, editData]);

    const loadLastItems = async () => {
        try {
            setLoading(true);
            const data = await assetService.getLastItems();
            if (data.items && data.items.length > 0) {
                setItems(data.items);
            } else {
                setItems([{ name: '', value: '' }]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { name: '', value: '' }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
    };

    const handleSave = async () => {
        // Validation
        if (!date) {
            setError('Date is required');
            return;
        }
        for (const item of items) {
            if (!item.name || item.value === '') {
                setError('All items must have a name and value');
                return;
            }
        }

        try {
            setLoading(true);
            await onSave({ date, items });
            onClose();
        } catch (err) {
            setError('Failed to save');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{editData ? 'Edit Asset' : 'New Asset'}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        fullWidth
                    />

                    <Typography variant="h6">Items (Total: {calculateSubtotal().toLocaleString()})</Typography>

                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell width={50}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <TextField
                                            value={item.name}
                                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                            fullWidth
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            type="number"
                                            value={item.value}
                                            onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                                            fullWidth
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => removeItem(index)} color="error" disabled={items.length === 1}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Button startIcon={<AddIcon />} onClick={addItem} variant="outlined" size="small">
                        Add Item
                    </Button>

                    {error && <Typography color="error">{error}</Typography>}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AssetDialog;
