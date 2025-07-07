import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Container,
    Stack,
    FormControl,
    FormLabel,
    Card,
    Table,
} from '@mui/joy';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useTransactionsSummaryByCategory } from '../hooks/transactions';
import { useDateFilters } from '../hooks/datefilters';

const REPORTS_DATE_FILTERS_STORAGE_KEY = 'reportsDateFilters';

export default function Reports() {
    const { 
        startDate: startDateStr, 
        endDate: endDateStr, 
        setDateFilters 
    } = useDateFilters(REPORTS_DATE_FILTERS_STORAGE_KEY);

    // Convert string dates to Dayjs objects for the DatePicker
    const startDate = startDateStr ? dayjs(startDateStr) : null;
    const endDate = endDateStr ? dayjs(endDateStr) : null;

    // Use a ref to track first render and initial fetch
    const initialFetch = useRef(true);

    const { 
        categorySummaries, 
        loading, 
        error, 
        refetch 
    } = useTransactionsSummaryByCategory(
        startDate?.format('YYYY-MM-DD') || dayjs().startOf('month').format('YYYY-MM-DD'),
        endDate?.format('YYYY-MM-DD') || dayjs().endOf('day').format('YYYY-MM-DD')
    );

          // Handle date changes
    const handleStartDateChange = useCallback((date: Dayjs | null) => {
        if (!date) return;
        setDateFilters(prev => ({
            startDate: date,
            endDate: prev?.endDate ? dayjs(prev.endDate) : dayjs()
        }));
    }, [setDateFilters]);

    const handleEndDateChange = useCallback((date: Dayjs | null) => {
        if (!date) return;
        setDateFilters(prev => ({
            startDate: prev?.startDate ? dayjs(prev.startDate) : dayjs().startOf('month'),
            endDate: date
        }));
    }, [setDateFilters]);

    // Initial data fetch
    useEffect(() => {
        if (initialFetch.current) {
            initialFetch.current = false;
            return;
        }
        refetch();
    }, [startDateStr, endDateStr, refetch]); // Only refetch when string dates change


    const handleResetFilters = () => {
        setDateFilters(prev => ({
            startDate: dayjs().startOf('month'),
            endDate: dayjs().endOf('day')
          }));
    };

    return (
        <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography level="title-lg">
                Transaction Reports
            </Typography>

            
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    <FormControl size="sm" sx={{ flex: 1 }}>
                        <FormLabel>Start Date</FormLabel>
                        <DatePicker
                            value={startDate}
                            onChange={(newValue) => handleStartDateChange(newValue)}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    fullWidth: true,
                                },
                            }}
                        />
                    </FormControl>
                    <FormControl size="sm" sx={{ flex: 1 }}>
                        <FormLabel>End Date</FormLabel>
                        <DatePicker
                            value={endDate}
                            onChange={(newValue) => handleEndDateChange(newValue)}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    fullWidth: true,
                                },
                            }}
                        />
                    </FormControl>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            onClick={handleResetFilters}
                            disabled={loading}
                            sx={{ height: '40px' }}
                        >
                            Reset to Current Month
                        </Button>
                    </Box>
                </Stack>
            </Box>
            {error && (
                <Alert color="danger" sx={{ mb: 3 }}>
                    Error loading reports: {error.toString()}
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
