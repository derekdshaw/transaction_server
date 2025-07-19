import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { CssVarsProvider, extendTheme } from '@mui/joy/styles';
import { GraphQLClient, ClientContext } from 'graphql-hooks';
import TransactionTable from '../TransactionsTable';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { CssBaseline } from '@mui/joy';
import {
    createTheme,
    ThemeProvider,
    THEME_ID as MATERIAL_THEME_ID,
} from '@mui/material/styles';
import { useTransactions, useUpdateTransaction } from '../../hooks/transactions';
import userEvent from '@testing-library/user-event';

// Mock the useTransactions hook
jest.mock('../../hooks/transactions', () => ({
    ...jest.requireActual('../../hooks/transactions'),
    useTransactions: jest.fn(),
    useUpdateTransaction: jest.fn(() => ({
        updateTransaction: jest.fn(),
        loading: false,
        error: null,
        data: null
    }))
}));

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    categoryName: string;
    categoryId: number;
}

const materialTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const theme = extendTheme({});

const mockTransactions: Transaction[] = [
    { id: '1', date: '2024-01-01', description: 'Test Transaction 1', amount: 100, categoryName: 'Food', categoryId: 1 },
    { id: '2', date: '2024-01-02', description: 'Test Transaction 2', amount: -50, categoryName: 'Transport', categoryId: 2 },
    { id: '3', date: '2024-01-03', description: 'Test Transaction 3', amount: 200, categoryName: 'Income', categoryId: 3 },
];


function renderWithProviders(
    ui: React.ReactElement,
    { client = new GraphQLClient({ url: 'http://localhost/fake-graphql' }) }: { client?: GraphQLClient } = {}
) {
    return render(
        <ClientContext.Provider value={client}>
            <ThemeProvider theme={{ [MATERIAL_THEME_ID]: materialTheme }}>
                <CssVarsProvider theme={theme} disableNestedContext>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <CssBaseline />
                        {ui}
                    </LocalizationProvider>
                </CssVarsProvider>
            </ThemeProvider>
        </ClientContext.Provider>
    );
}

describe('TransactionTable', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 1. Basic Render & Data Display
    it('displays the transaction data correctly', async () => {
        (useTransactions as jest.Mock).mockReturnValue({
            transactions: mockTransactions,
            loading: false,
            error: null,
            refetch: jest.fn()
        });

        renderWithProviders(<TransactionTable initialStartDate="2024-01-01" initialEndDate="2024-01-31" />);


        const table = await screen.findByRole('table', { name: /transactions table/i });
        expect(table).toBeInTheDocument();
        const rows = await within(table).findAllByRole('row');

        await waitFor(() => {
             // Only rows within the table
            expect(rows.length).toBeGreaterThan(1); // header + data rows
            expect(within(rows[1]).getByText('Test Transaction 3')).toBeInTheDocument();
            expect(within(rows[1]).getByText('$200.00')).toBeInTheDocument();
            expect(within(rows[1]).getByText('Income')).toBeInTheDocument();
        });
    });

    // 2. Loading State
    it('shows loading state while fetching data', async () => {
        (useTransactions as jest.Mock).mockReturnValue({
            transactions: [],
            loading: true,
            error: null,
            refetch: jest.fn()
        });

        renderWithProviders(<TransactionTable />);
        
        await waitFor(() => {
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
    });

    // 3. Error State
    it('displays error message when data fetch fails', async () => {
        (useTransactions as jest.Mock).mockReturnValue({
            transactions: [],
            loading: false,
            error: {
                fetchError: { message: 'Network Error' },
                graphQLErrors: null
            },
            refetch: jest.fn()
        });

        renderWithProviders(<TransactionTable />);
        await waitFor(() => {
            expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
        });
    });

    // 4. Empty State
    it('displays empty state when no transactions', async () => {
        (useTransactions as jest.Mock).mockReturnValue({
            transactions: [],
            loading: false,
            error: null,
            refetch: jest.fn()
        });

        renderWithProviders(<TransactionTable />);
        
        await waitFor(() => {
            expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
        });
    });

    // 5. Data Formatting
    it('formats currency and dates correctly', async () => {
        (useTransactions as jest.Mock).mockReturnValue({
            transactions: mockTransactions,
            loading: false,
            error: null,
            refetch: jest.fn()
        });

        renderWithProviders(<TransactionTable initialStartDate="2024-01-01" initialEndDate="2024-01-31" />);
        
        await waitFor(() => {
            expect(screen.getByText('$100.00')).toBeInTheDocument();
            expect(screen.getByText('-$50.00')).toBeInTheDocument();
            expect(screen.getByText('2024-01-01')).toBeInTheDocument();
        });
    });

    // 6. Sorting (if implemented in your component)
    it('sorts transactions by date by default', async () => {
        (useTransactions as jest.Mock).mockReturnValue({
            transactions: mockTransactions,
            loading: false,
            error: null,
            refetch: jest.fn()
        });

        renderWithProviders(<TransactionTable initialStartDate="2024-01-01" initialEndDate="2024-01-31" />);
        
        await waitFor(() => {
            const rows = screen.getAllByRole('row');
            // First data row should contain the oldest date
            expect(rows[1]).toHaveTextContent('2024-01-03');
        });
    });

    // 7. Interaction - Table Rows
    it('displays clickable rows with transaction data', async () => {
        (useTransactions as jest.Mock).mockReturnValue({
            transactions: mockTransactions,
            loading: false,
            error: null,
            refetch: jest.fn()
        });

        renderWithProviders(<TransactionTable initialStartDate="2024-01-01" initialEndDate="2024-01-31" />);
        
        await waitFor(() => {
            // Verify transaction data is displayed
            expect(screen.getByText('Test Transaction 1')).toBeInTheDocument();
            expect(screen.getByText('$100.00')).toBeInTheDocument();
            // the category drop down has "Food", but we want the one in the table under a div.
            const foodDiv = screen.getAllByText('Food').find(
                el => el.tagName === 'DIV'
              );
            expect(foodDiv).toBeInTheDocument();
            
            // Verify table structure
            const rows = screen.getAllByRole('row');
            expect(rows.length).toBeGreaterThan(1); // header + data rows
            
            // Verify data row contains expected content
            const firstDataRow = rows[1]; // First row after header
            expect(firstDataRow).toHaveTextContent('Test Transaction 3');
            expect(firstDataRow).toHaveTextContent('$200.00');
            expect(firstDataRow).toHaveTextContent('Income');
        });
    });

    // 8. Accessibility
    it('has proper ARIA attributes', async () => {
        (useTransactions as jest.Mock).mockReturnValue({
            transactions: mockTransactions,
            loading: false,
            error: null,
            refetch: jest.fn()
        });

        renderWithProviders(<TransactionTable initialStartDate="2024-01-01" initialEndDate="2024-01-31" />);
        
        await waitFor(() => {
            const table = screen.getByRole('table');
            expect(table).toHaveAttribute('aria-label', 'transactions table');
            
            const headerCells = screen.getAllByRole('columnheader');
            expect(headerCells.length).toBeGreaterThan(0);
            
            const rows = screen.getAllByRole('row');
            expect(rows.length).toBeGreaterThan(1); // header + data rows
        });
    });
});
