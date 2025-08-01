// src/components/TransactionsTable.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import CircularProgress from '@mui/joy/CircularProgress';
import Alert from '@mui/joy/Alert';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropUpIcon from '@mui/icons-material/ArrowUpward';
import { useTransactions, type Transaction } from '../hooks/transactions';
import { useUpdateTransaction } from '../hooks/transactions';
import { Input, Stack, FormControl, FormLabel, Select, Option, Box } from '@mui/joy';
import dayjs, { Dayjs } from 'dayjs';
import { getDateFilters, useDateFilters } from '../hooks/datefilters';
import StartEndDatePicker from './StartEndDatePicker';

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: keyof Transaction;
  direction: SortDirection;
}

interface FilterValues {
  description: string;
  amount: string;
  category: string;
}

interface TransactionTableProps {
  initialStartDate?: string;
  initialEndDate?: string;
}

const TRANSACTIONS_TABLE_DATE_FILTERS_STORAGE_KEY = 'transactionTableDateFilters';

export default function TransactionsTable({ initialStartDate, initialEndDate, ...props }: TransactionTableProps) {
  const { transactions: initialTransactions, loading, error, refetch } = useTransactions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const { startDate, endDate, setDateFilters } = useDateFilters(
    TRANSACTIONS_TABLE_DATE_FILTERS_STORAGE_KEY,
    initialStartDate || dayjs().startOf('month').format('YYYY-MM-DD'),
    initialEndDate || dayjs().format('YYYY-MM-DD')
  );

  // Memoize the date strings to prevent unnecessary refetches
  const startDateStr = useMemo(() => (startDate ?? dayjs().startOf('month').format('YYYY-MM-DD')), [startDate]);
  const endDateStr = useMemo(() => (endDate ?? dayjs().format('YYYY-MM-DD')), [endDate]);

  // Refetch when date range changes, using the memoized date strings
  useEffect(() => {
    refetch();
  }, [startDateStr, endDateStr, refetch]);

  const [filters, setFilters] = useState<FilterValues>({
    description: '',
    amount: '',
    category: ''
  });

  const handleDateRangeChange = useCallback((newStartDate: Dayjs, newEndDate: Dayjs) => {
    setDateFilters(() => ({
  startDate: newStartDate,
  endDate: newEndDate
}));
  }, [setDateFilters]);

  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(null);
  const [updateAlert, setUpdateAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const { updateTransaction, loading: updating } = useUpdateTransaction();

  // Initialize transactions state when initialTransactions changes
  React.useEffect(() => {
    if (initialTransactions.length > 0) {
      setTransactions(initialTransactions);
    }
  }, [initialTransactions]);


  const categories = useMemo(() => {
    const categoryMap = new Map<string, { id: number; name: string }>();
    initialTransactions.forEach(tx => {
      if (tx.categoryName && tx.categoryId) {
        // Only add if we have both name and ID
        if (!categoryMap.has(tx.categoryName)) {
          categoryMap.set(tx.categoryName, {
            id: tx.categoryId,
            name: tx.categoryName
          });
        }
      }
    });
    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [initialTransactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply filters
    result = result.filter(tx => {
      const transactionDate = dayjs(tx.date).startOf('day');
      const curStartDate = dayjs(startDate).startOf('day');
      const curEndDate = dayjs(endDate).endOf('day');

      const matchesStartDate = !curStartDate || !transactionDate.isBefore(curStartDate, 'day');
      const matchesEndDate = !curEndDate || !transactionDate.isAfter(curEndDate, 'day');

      // Compare category IDs with type conversion to handle string/number mismatches
      const matchesCategory = !filters.category ||
        (tx.categoryId !== null &&
          tx.categoryId !== undefined &&
          String(tx.categoryId) === String(filters.category));

      return (
        matchesStartDate &&
        matchesEndDate &&
        (filters.description === '' ||
          tx.description.toLowerCase().includes(filters.description.toLowerCase())) &&
        (filters.amount === '' ||
          tx.amount.toString().includes(filters.amount)) &&
        matchesCategory
      );
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        if (a[sortConfig.key] === undefined || b[sortConfig.key] === undefined) {
          return 0;
        }

        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [transactions, startDate, endDate, sortConfig, filters]);

  const handleFilterChange = (field: keyof FilterValues, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const requestSort = (key: keyof Transaction) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Transaction) => {
    const iconStyle = {
      fontSize: '1.25rem',
      ml: 0.5,
      color: 'primary.500',
      '&:hover': { opacity: 0.8 },
      width: '1.25rem',
      height: '1.25rem',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    if (sortConfig.key !== key || sortConfig.direction === null) {
      return <ArrowDropDownIcon sx={{ ...iconStyle, opacity: 0, color: 'transparent' }} />;
    }

    return sortConfig.direction === 'asc' ?
      <ArrowDropUpIcon sx={{ ...iconStyle, opacity: 1 }} /> :
      <ArrowDropDownIcon sx={{ ...iconStyle, opacity: 1 }} />;
  };

  if (loading) return <CircularProgress />;

  if (error) {
    const gqlMessages = error.graphQLErrors
      ?.map(gqlErr => gqlErr.message)
      .join('; ');
    const netMessage = error.fetchError?.message;
    const displayMessage = gqlMessages || netMessage || 'An unexpected error occurred';
    return <Alert color="danger">{displayMessage}</Alert>;
  }

  if (!initialTransactions.length) {
    return <Alert color="neutral">No transactions found</Alert>;
  }

  const handleCategoryChange = async (transactionId: string, newCategoryName: string, newCategoryId: number) => {
    try {
      const tx = transactions.find(t => t.id === transactionId);
      if (!tx) return;

      const updatedTx = await updateTransaction(
        transactionId,     // id: string
        tx.amount,         // amount: number
        tx.description,    // description: string
        tx.date,           // date: string
        newCategoryId      // categoryId: number
      );

      if (updatedTx) {
        // Update the transactions array with the updated transaction
        setTransactions(prevTransactions =>
          prevTransactions.map(tx =>
            tx.id === transactionId
              ? { ...tx, categoryId: newCategoryId, categoryName: newCategoryName }
              : tx
          )
        );

        setUpdateAlert({ type: 'success', message: 'Category updated successfully' });
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setUpdateAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update category'
      });
    } finally {
      setEditingTransaction(null);
      setTimeout(() => setUpdateAlert(null), 3000);
    }
  };

  return (

    <Sheet
      variant="outlined"
      sx={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        borderRadius: "sm",
        boxShadow: "sm",
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'neutral.outlinedBorder' }}>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <FormControl size="sm" sx={{ width: 510, pt: 3 }}>
            <StartEndDatePicker
              storageKey={TRANSACTIONS_TABLE_DATE_FILTERS_STORAGE_KEY}
              startDate={startDate || dayjs().startOf('month')}
              endDate={endDate || dayjs()}
              onDatesChange={handleDateRangeChange}
              className="w-full"
            />
          </FormControl>
          <FormControl size="sm" sx={{ flex: 1 }}>
            <FormLabel>Description</FormLabel>
            <Input
              placeholder="Filter by description"
              value={filters.description}
              onChange={(e) => handleFilterChange('description', e.target.value)}
              size="sm"
              sx={{
                '& .MuiInput-input': {
                  height: '40px',
                  boxSizing: 'border-box',
                },
              }}
            />
          </FormControl>
          <FormControl size="sm" sx={{ width: 150 }}>
            <FormLabel>Amount</FormLabel>
            <Input
              placeholder="Filter by amount"
              value={filters.amount}
              onChange={(e) => handleFilterChange('amount', e.target.value)}
              size="sm"
              type="number"
              sx={{
                '& .MuiInput-input': {
                  height: '40px',
                  boxSizing: 'border-box',
                },
              }}
            />
          </FormControl>
          <FormControl size="sm" sx={{ width: 200 }}>
            <FormLabel>Category</FormLabel>
            <Select
              placeholder="Filter by category"
              value={filters.category}
              onChange={(_e, value) => handleFilterChange('category', value || '')}
              size="sm"
              sx={{
                '--Select-minHeight': '40px',
                '--Select-paddingBlock': '12px',
                '--Select-decoratorChildHeight': '40px',
                '&:hover': {
                  '--Select-indicatorColor': 'var(--joy-palette-primary-500)',
                },
              }}
              slotProps={{
                root: {
                  sx: {
                    minHeight: '40px',
                    height: '40px',
                  },
                },
                button: {
                  sx: {
                  },
                },
                listbox: {
                  sx: {
                    '--List-padding': '4px',
                    '--List-radius': '6px',
                  },
                },
              }}
            >
              <Option value="">All Categories</Option>
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Box>
      <Table
        aria-label="transactions table"
        stickyHeader
        hoverRow
        sx={{ minWidth: 650 }}
        role="table"
      >
        <thead>
          <tr>
            <th onClick={() => requestSort('date')}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Date {getSortIcon('date')}
              </div>
            </th>
            <th onClick={() => requestSort('description')}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Description {getSortIcon('description')}
              </div>
            </th>
            <th onClick={() => requestSort('amount')}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                Amount {getSortIcon('amount')}
              </div>
            </th>
            <th onClick={() => requestSort('categoryName')}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Category {getSortIcon('categoryName')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedTransactions.length > 0 ? (
            filteredAndSortedTransactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.date}</td>
              <td>{tx.description}</td>
              <td style={{ textAlign: "right" }}>
                {tx.amount.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })}
              </td>
              <td style={{ cursor: 'pointer' }}>
                {editingTransaction === tx.id ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Select
                      autoFocus
                      value={selectedCategory?.id?.toString() || ''}
                      onChange={(_, value) => {
                        if (value) {
                          const selected = categories.find(cat => cat.id.toString() === value);
                          if (selected) {
                            handleCategoryChange(tx.id, selected.name, selected.id);
                            setEditingTransaction(null);
                          }
                        }
                      }}
                      onClose={() => setEditingTransaction(null)}
                      slotProps={{
                        root: { open: true },
                        listbox: {
                          placement: 'bottom-start',
                        },
                      }}
                    >
                      {categories.map(category => (
                        <Option key={category.id} value={category.id.toString()}>
                          {category.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <div onClick={() => {
                    setEditingTransaction(tx.id);
                    const currentCategory = tx.categoryId && tx.categoryName
                      ? { id: tx.categoryId, name: tx.categoryName }
                      : null;
                    setSelectedCategory(currentCategory);
                  }}>
                    {tx.categoryName || 'Uncategorized'}
                  </div>
                )}
              </td>
            </tr>
          ))
          ) : (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '12px 16px' }}>
                No transactions found for the selected date range
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Sheet>

  );
}