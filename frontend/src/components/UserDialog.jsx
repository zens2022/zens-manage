import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
} from '@mui/material';

const UserDialog = ({ open, onClose, onSave, user }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setPassword(''); // Don't show password
        } else {
            setUsername('');
            setPassword('');
        }
    }, [user, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            id: user ? user.id : undefined,
            username,
            password: password || undefined, // Send undefined if empty on edit
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{user ? 'Edit User' : 'New User'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Username"
                        fullWidth
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <TextField
                        margin="dense"
                        label={user ? 'Password (leave blank to keep)' : 'Password'}
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={!user}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="inherit">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary">
                        Save
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default UserDialog;
