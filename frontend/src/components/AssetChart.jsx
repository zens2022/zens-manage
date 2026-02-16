import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import moment from 'moment';

const AssetChart = ({ data }) => {
    // Process data for chart: sort by date ascending
    const chartData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Custom formatter for numbers with thousand separators
    const formatNumber = (value) => {
        return value.toLocaleString();
    };

    const yAxisFormatter = (value) => {
        if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
        if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
        return value.toLocaleString();
    };

    // Custom tooltip formatter
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>
                        {moment(label).format('YYYY-MM-DD')}
                    </p>
                    <p style={{ margin: '5px 0 0 0', color: '#8884d8' }}>
                        {formatNumber(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Asset Trend</Typography>
            <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => moment(str).format('YYYY-MM-DD')}
                        />
                        <YAxis tickFormatter={yAxisFormatter} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default AssetChart;
