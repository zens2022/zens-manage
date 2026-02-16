import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/api/user/login', { username, password });
            if (res.success) {
                localStorage.setItem('user', JSON.stringify(res.data));
                navigate('/users', { replace: true });
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            }}
        >
            <Paper
                elevation={10}
                sx={{
                    p: 4,
                    maxWidth: 400,
                    width: '100%',
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Typography variant="h4" component="h1" align="center" gutterBottom fontWeight="bold" color="primary">
                    Zens Manage
                </Typography>
                <Typography variant="body2" align="center" color="textSecondary" mb={3}>
                    Please sign in to continue
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Username"
                        variant="outlined"
                        margin="normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        variant="outlined"
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{
                            mt: 3,
                            mb: 2,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #1e3c72 30%, #2a5298 90%)',
                            boxShadow: '0 3px 5px 2px rgba(30, 60, 114, .3)',
                        }}
                    >
                        Sign In
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default Login;
