import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Reports from '../Reports';
import { renderWithProviders } from './utils';
import dayjs from 'dayjs';

jest.mock('../../hooks/transactions', () => ({
  useTransactionsSummaryByCategory: jest.fn()
}));

jest.mock('../../hooks/datefilters', () => ({
  getDateFilters: jest.fn(),
  useDateFilters: jest.fn()
}));

const mockUseTransactionsSummaryByCategory = require('../../hooks/transactions').useTransactionsSummaryByCategory;
const mockGetDateFilters = require('../../hooks/datefilters').getDateFilters;
const mockUseDateFilters = require('../../hooks/datefilters').useDateFilters;

const mockCategorySummaries = [
  { categoryId: 1, categoryName: 'Food', totalAmount: 100, transactionCount: 10 },
  { categoryId: 2, categoryName: 'Transport', totalAmount: 50, transactionCount: 5 },
  { categoryId: 3, categoryName: 'Income', totalAmount: 200, transactionCount: 20 },
];

describe('Reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDateFilters.mockReturnValue({
      startDate: dayjs('2024-01-01'),
      endDate: dayjs('2024-01-31')
    });

    mockUseDateFilters.mockReturnValue({
      startDate: dayjs('2024-01-01'),
      endDate: dayjs('2024-01-31'),
      setDateFilters: jest.fn()
    });
  });

  it('renders the date picker and table', async () => {
    mockUseTransactionsSummaryByCategory.mockReturnValue({
      categorySummaries: mockCategorySummaries,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    renderWithProviders(<Reports />);
    await waitFor(async () => {
      // Date pickers
      expect(screen.getAllByLabelText(/start date/i)[0]).toBeInTheDocument();
      expect(screen.getAllByLabelText(/end date/i)[0]).toBeInTheDocument();

      // Table
      const table = await screen.findByRole('table');
      expect(table).toBeInTheDocument();
      const rows = await within(table).findAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // header + data rows
      expect(within(rows[1]).getByText('Food')).toBeInTheDocument();
      expect(within(rows[1]).getByText('$100.00')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    mockUseTransactionsSummaryByCategory.mockReturnValue({
      categorySummaries: [],
      loading: true,
      error: null,
      refetch: jest.fn()
    });
    renderWithProviders(<Reports />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseTransactionsSummaryByCategory.mockReturnValue({
      categorySummaries: [],
      loading: false,
      error: { fetchError: { message: 'Network Error' } },
      refetch: jest.fn()
    });
    renderWithProviders(<Reports />);
    expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    mockUseTransactionsSummaryByCategory.mockReturnValue({
      categorySummaries: [],
      loading: false,
      error: null,
      refetch: jest.fn()
    });
    renderWithProviders(<Reports />);
    expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
  });

  it('calls refetch on button click', async () => {
    const refetch = jest.fn();
    mockUseTransactionsSummaryByCategory.mockReturnValue({
      categorySummaries: mockCategorySummaries,
      loading: false,
      error: null,
      refetch
    });
    renderWithProviders(<Reports />);
    const refreshButton = screen.getByRole('button', { name: /Reset/i });
    await userEvent.click(refreshButton);
    expect(refetch).toHaveBeenCalled();
  });
});
