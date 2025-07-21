import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Stack,
    Table,
} from '@mui/joy';
import dayjs, { Dayjs } from 'dayjs';
import { useTransactionsSummaryByCategory } from '../hooks/transactions';
import { getDateFilters } from '../hooks/datefilters';
import StartEndDatePicker from './StartEndDatePicker';

const REPORTS_DATE_FILTERS_STORAGE_KEY = 'reportsDateFilters';

export default function Reports() {

    const [dateRange, setDateRange] = useState(() => {
        const savedDates = getDateFilters(REPORTS_DATE_FILTERS_STORAGE_KEY);
        return {
            startDate: savedDates?.startDate || dayjs().startOf('month'),
            endDate: savedDates?.endDate || dayjs()
        };
    });

    const {
        categorySummaries,
        loading,
        error,
        refetch
    } = useTransactionsSummaryByCategory(
        dateRange.startDate.format('YYYY-MM-DD') || dayjs().startOf('month').format('YYYY-MM-DD'),
        dateRange.endDate.format('YYYY-MM-DD') || dayjs().endOf('day').format('YYYY-MM-DD')
    );

    // Memoize the date strings to prevent unnecessary refetches
    const startDateStr = useMemo(() => dateRange.startDate.format('YYYY-MM-DD'), [dateRange.startDate]);
    const endDateStr = useMemo(() => dateRange.endDate.format('YYYY-MM-DD'), [dateRange.endDate]);

    // Refetch when date range changes, using the memoized date strings
    useEffect(() => {
        refetch();
    }, [startDateStr, endDateStr, refetch]);
    const handleResetFilters = () => {
        setDateRange(prev => ({
            startDate: dayjs().startOf('month'),
            endDate: dayjs().endOf('day')
        }));
    };

    const handleDateRangeChange = useCallback((newStartDate: Dayjs, newEndDate: Dayjs) => {
        setDateRange(prev => {
            const startChanged = !newStartDate.isSame(prev.startDate, 'day');
            const endChanged = !newEndDate.isSame(prev.endDate, 'day');

            if (startChanged || endChanged) {
                return { startDate: newStartDate, endDate: newEndDate };
            }
            return prev;
        });
    }, []);

    return (
        <Box>
            <Box sx={{ p:2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
                <Typography level="title-lg">
                    Transaction Reports
                </Typography>
                <StartEndDatePicker
                    storageKey={REPORTS_DATE_FILTERS_STORAGE_KEY}
                    onDatesChange={handleDateRangeChange}
                    className="w-full"
                />
                <Button
                    variant="outlined"
                    onClick={handleResetFilters}
                    disabled={loading}
                    sx={{ height: '40px',  }}
                >
                    Reset
                </Button>
            </Box>
            {error && (
                <Alert color="danger" sx={{ mb: 3 }}>
                    Error loading reports: {error.fetchError?.message || error.graphQLErrors?.[0].message}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : categorySummaries ? (
                <Box sx={{ overflow: 'auto' }}>
                    <Table hoverRow variant="outlined">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Category</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Transaction Count</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categorySummaries.length > 0 ? (
                                categorySummaries.map((row) => (
                                    <tr key={row.categoryId}>
                                        <td style={{ padding: '12px 16px' }}>{row.categoryName || 'Uncategorized'}</td>
                                        <td style={{ textAlign: 'right', padding: '12px 16px' }}>{row.transactionCount}</td>
                                        <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                                            {new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: 'USD',
                                            }).format(row.totalAmount)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '12px 16px' }}>
                                        No transactions found for the selected date range
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Box>
            ) : null}
        </Box>
    );
}
