import React, { useState } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    IconButton,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    People as PeopleIcon,
    Logout as LogoutIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Drawer is now permanent and menu toggle is removed
    const open = true;

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const menuItems = [
        { text: 'Assets', icon: <DashboardIcon />, path: '/assets' },
        { text: 'User', icon: <PeopleIcon />, path: '/users' },
        // Add more menu items here later
    ];

    const drawer = (
        <Box>
            <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: [1] }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e3c72' }}>
                    Zens Manage
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => navigate(item.path)}
                        selected={location.pathname === item.path}
                        sx={{
                            my: 0.5,
                            mx: 1,
                            borderRadius: '8px',
                            '&.Mui-selected': {
                                backgroundColor: 'rgba(30, 60, 114, 0.08)',
                                color: '#1e3c72',
                                '& .MuiListItemIcon-root': {
                                    color: '#1e3c72',
                                },
                            },
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
            <Divider sx={{ mt: 'auto' }} />
            <List>
                <ListItem button onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: '#1e3c72',
                    borderRadius: 0,
                    transition: (theme) =>
                        theme.transitions.create(['width', 'margin'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                        Zens Manage
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                open={open}
                onClose={null}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
            >
                {drawer}
            </Drawer>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: `calc(100% - ${drawerWidth}px)`,
                    mt: '64px',
                    transition: (theme) =>
                        theme.transitions.create('margin', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout;
