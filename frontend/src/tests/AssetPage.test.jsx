import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AssetPage from '../pages/AssetPage';
import { assetService } from '../services/assetService';

// Mock assetService
jest.mock('../services/assetService', () => ({
    assetService: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        getLastItems: jest.fn()
    }
}));

// Mock child components to simplify testing
jest.mock('../components/AssetChart', () => () => <div data-testid="asset-chart">Chart</div>);
jest.mock('../components/AssetDialog', () => () => <div data-testid="asset-dialog">Dialog</div>);

const mockAssets = [
    {
        id: 1,
        date: '2025-01-01',
        userId: 1,
        total: 300,
        User: { username: 'testuser' },
        items: [
            { id: 101, name: 'Stock', value: 100 },
            { id: 102, name: 'Cash', value: 200 }
        ]
    }
];

describe('AssetPage', () => {
    beforeEach(() => {
        // Mock localStorage
        localStorage.setItem('user', JSON.stringify({ id: 1, token: 'mock-token' }));

        // Mock API responses
        assetService.list.mockResolvedValue({
            data: mockAssets,
            total: 1
        });

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: [{ id: 1, username: 'testuser' }] }),
            })
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    test('renders AssetPage and fetches data', async () => {
        render(<AssetPage />);

        // Check title
        expect(screen.getByText('Assets')).toBeInTheDocument();

        // Check "New Asset" button
        expect(screen.getByText('New Asset')).toBeInTheDocument();

        // Check if Chart renders
        expect(screen.getByTestId('asset-chart')).toBeInTheDocument();

        // Check if data is loaded
        await waitFor(() => {
            expect(screen.getByText('2025-01-01')).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});
