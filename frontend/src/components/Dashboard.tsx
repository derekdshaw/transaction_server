import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { useTransactionsByDateRange } from '../hooks/transactions';
import {
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Box,
    Stack,
    FormControl,
    Table,
    Sheet
} from '@mui/joy';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useDateFilters } from '../hooks/datefilters';

export default function Dashboard() {

    const [categoryData, setCategoryData] = useState<Array<{ id: number, value: number, label: string }>>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    const DASHBOARD_DATE_FILTERS_STORAGE_KEY = 'dashboardDateFilters';
    const defaultStartDate = useMemo(() => dayjs().startOf('month').format('YYYY-MM-DD'), []);
    const defaultEndDate = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

    const { 
        startDate: startDateStr, 
        endDate: endDateStr, 
        setDateFilters 
    } = useDateFilters(DASHBOARD_DATE_FILTERS_STORAGE_KEY, defaultStartDate, defaultEndDate);

    const { startDate, endDate } = useMemo(() => ({
        startDate: startDateStr ? dayjs(startDateStr) : dayjs(defaultStartDate),
        endDate: endDateStr ? dayjs(endDateStr) : dayjs(defaultEndDate),
    }), [startDateStr, endDateStr, defaultStartDate, defaultEndDate]);

    const { transactions, loading, error, refetch } = useTransactionsByDateRange(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'));

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
        refetch();
    }, [startDate, endDate, refetch]); // Only refetch when string dates change

    const dateFilteredTransactions = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        return transactions.filter(tx => {
            const txDate = dayjs(tx.date);
            return (!startDate || (txDate.isAfter(startDate) || txDate.isSame(startDate, 'day')) && 
                   (!endDate || txDate.isBefore(endDate) || txDate.isSame(endDate, 'day')));
        });
    }, [transactions, startDate, endDate]);

    useEffect(() => {
        if (!dateFilteredTransactions || dateFilteredTransactions.length === 0) {
            setCategoryData([]);
            return;
        }

        const categoryMap = new Map<number, { id: number; value: number; label: string }>();
        
        dateFilteredTransactions.forEach(tx => {
            const categoryId = tx.categoryId || 0;
            const categoryName = tx.categoryName || 'Uncategorized';
            const current = categoryMap.get(categoryId) || { 
                id: categoryId, 
                value: 0, 
                label: categoryName 
            };
            current.value += Math.abs(tx.amount);
            categoryMap.set(categoryId, current);
        });

        setCategoryData(Array.from(categoryMap.values()));
    }, [dateFilteredTransactions]);

    const filteredTransactions = useMemo(() => {
        if (!selectedCategoryId) return dateFilteredTransactions;
        return dateFilteredTransactions.filter(
            transaction => transaction.categoryId.toString() === selectedCategoryId
        );
    }, [dateFilteredTransactions, selectedCategoryId]);

    const totalAmount = useMemo(() => {
        if (selectedCategoryId) {
            // Find the selected category's total from categoryData
            const selectedCategory = categoryData.find(cat =>
                cat.id.toString() === selectedCategoryId
            );
            return selectedCategory ? selectedCategory.value : 0;
        }
        // Otherwise, sum all filtered transactions
        return filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    }, [filteredTransactions, selectedCategoryId, categoryData]);

    // Add click handler to pie chart segments
    useEffect(() => {
        const handleChartClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Try to find the closest arc element or its child
            const pathElement = target.closest('path');
            if (!pathElement) {
                setSelectedCategoryId(null);
                return;
            }

            // Get all arc paths in the chart
            const allPaths = Array.from(chartContainerRef.current?.querySelectorAll('path') || []);
            const clickedIndex = allPaths.indexOf(pathElement);

            // Check if we found a valid index and have corresponding category data
            if (clickedIndex >= 0 && clickedIndex < categoryData.length) {
                const category = categoryData[clickedIndex];
                if (category) {
                    // Toggle selection if clicking the same category
                    setSelectedCategoryId(prevId =>
                        prevId === category.id.toString() ? null : category.id.toString()
                    );
                }
            }
        };

        // Add event listener to the chart container
        const container = chartContainerRef.current;
        if (container) {
            container.addEventListener('click', handleChartClick);
        }

        // Clean up
        return () => {
            if (container) {
                container.removeEventListener('click', handleChartClick);
            }
        };
    }, [categoryData]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        const gqlMessages = error.graphQLErrors
            ?.map(gqlErr => gqlErr.message)
            .join('; ');
        const netMessage = error.fetchError?.message;
        const displayMessage = gqlMessages || netMessage || 'An unexpected error occurred';

        return (
            <Alert color="danger" sx={{ m: 2 }}>
                {displayMessage}
            </Alert>
        );
    }

    return (

        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography level="title-lg">Spending by Category</Typography>
                <Typography level="body-sm" sx={{ pr: 6 }}>
                    Click on a category in the pie chart to filter transactions by that category. Click anywhere else on the chart to reset the filter to no category.
                </Typography>
                <Stack direction="row" spacing={2}>
                    <FormControl>
                        <DatePicker
                            label="Start Date"
                            value={startDate}
                            onChange={(newValue: Dayjs | null) => handleStartDateChange(newValue)}
                            slotProps={{
                                textField: {
                                    variant: 'outlined',
                                    fullWidth: true
                                }
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <DatePicker
                            label="End Date"
                            value={endDate}
                            onChange={(newValue: Dayjs | null) => handleEndDateChange(newValue)}
                            slotProps={{
                                textField: {
                                    variant: 'outlined',
                                    fullWidth: true
                                }
                            }}
                        />
                    </FormControl>
                </Stack>
            </Box>
            
            <Card variant="outlined" sx={{ maxWidth: '100%', mx: 'auto' }}>
                <CardContent>
                    {categoryData.length > 0 ? (
                        <div ref={chartContainerRef} onClick={e => e.stopPropagation()}>
                            <PieChart
                                series={[
                                    {
                                        data: categoryData,
                                        highlightScope: { fade: 'global', highlight: 'item' },
                                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                    },
                                ]}
                                height={400}
                                slotProps={{
                                    legend: {
                                        direction: 'row',
                                        position: { vertical: 'bottom', horizontal: 'center' },
                                        padding: 0,
                                    },
                                }}
                            />
                        </div>
                    ) : (
                        <Alert color="neutral">No category data available for the selected date range</Alert>
                    )}
                </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mt: 3 }}>
                <CardContent>
                    <Typography level="title-lg" component="div" sx={{ mb: 2 }}>
                        Transactions
                    </Typography>
                    <Sheet
                        variant="outlined"
                        sx={{
                            width: "100%",
                            maxHeight: 400,
                            overflow: "auto",
                            borderRadius: "sm",
                            boxShadow: "sm",
                        }}
                    >
                        <Table
                            aria-label="transactions table"
                            stickyHeader
                            stickyFooter
                            hoverRow
                            sx={{
                                '--TableHeader-height': 'calc(1 * 2.5rem)',
                                '--TableRow-hoverBackground': (theme) => theme.vars.palette.background.level1,
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ width: 120 }}>Date</th>
                                    <th>Description</th>
                                    <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
                                    <th style={{ width: 150 }}>Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td>{dayjs(transaction.date).format('MM/DD/YYYY')}</td>
                                            <td>{transaction.description}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                {transaction.amount.toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                })}
                                            </td>
                                            <td>{transaction.categoryName || 'Uncategorized'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>
                                            No transactions found matching the current filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th colSpan={2} style={{ textAlign: 'right' }}>Total:</th>
                                    <th style={{ textAlign: 'right' }}>
                                        {totalAmount.toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        })}
                                    </th>
                                    <th></th>
                                </tr>
                            </tfoot>
                        </Table>
                    </Sheet>
                </CardContent>
            </Card>
        </Box>
    );
}
