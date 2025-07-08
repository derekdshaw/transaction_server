import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDateFilters } from '../hooks/datefilters';
import { FormControl, FormLabel, Stack } from '@mui/joy';

interface StartEndDatePickerProps {
    storageKey: string;
    defaultStartDate?: string;
    defaultEndDate?: string;
    onDatesChange?: (startDate: Dayjs, endDate: Dayjs) => void;
    className?: string;
    labelFormat?: string;
    disableFuture?: boolean;
}

export default function StartEndDatePicker({
    storageKey,
    defaultStartDate = dayjs().startOf('month').format('YYYY-MM-DD'),
    defaultEndDate = dayjs().format('YYYY-MM-DD'),
    onDatesChange,
    className = '',
    labelFormat = 'MM/DD/YYYY',
    disableFuture = true,
}: StartEndDatePickerProps) {
    // Use the date filters hook for state management
    const {
        startDate: startDateStr,
        endDate: endDateStr,
        setDateFilters
    } = useDateFilters(storageKey, defaultStartDate, defaultEndDate);

    // Memoized dayjs objects for the date pickers
    const { startDate, endDate } = useMemo(() => ({
        startDate: startDateStr ? dayjs(startDateStr) : dayjs(defaultStartDate),
        endDate: endDateStr ? dayjs(endDateStr) : dayjs(defaultEndDate),
    }), [startDateStr, endDateStr, defaultStartDate, defaultEndDate]);

    // Handle date changes
    const handleStartDateChange = useCallback((date: Dayjs | null) => {
        if (!date) return;

        setDateFilters(prev => {
            const currentEnd = prev.endDate ? dayjs(prev.endDate) : dayjs(defaultEndDate);

            // Ensure start date is not after end date
            const newEnd = date.isAfter(currentEnd) ? date : currentEnd;

            return {
                startDate: date,
                endDate: newEnd,
            };
        });
    }, [defaultEndDate, setDateFilters]);

    const handleEndDateChange = useCallback((date: Dayjs | null) => {
        if (!date) return;

        setDateFilters(prev => {
            const currentStart = prev.startDate ? dayjs(prev.startDate) : dayjs(defaultStartDate);

            // Ensure end date is not before start date
            const newStart = date.isBefore(currentStart) ? date : currentStart;

            return {
                startDate: newStart,
                endDate: date,
            };
        });
    }, [defaultStartDate, setDateFilters]);

    // Notify parent component of date changes only when dates actually change
    const prevDatesRef = useRef({ startDate: startDateStr, endDate: endDateStr });

    useEffect(() => {
        // Only trigger onDatesChange if the string values have actually changed
        if (
            prevDatesRef.current.startDate !== startDateStr ||
            prevDatesRef.current.endDate !== endDateStr
        ) {
            onDatesChange?.(startDate, endDate);
            prevDatesRef.current = { startDate: startDateStr, endDate: endDateStr };
        }
    }, [startDateStr, endDateStr, startDate, endDate, onDatesChange]);

    return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <FormControl size="sm" sx={{ flex: 1 }}>
                <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    format={labelFormat}
                    disableFuture={disableFuture}
                    slotProps={{
                        textField: {
                            size: 'small',
                            variant: 'outlined',
                        },
                    }}
                />
            </FormControl>
            <FormControl size="sm" sx={{ flex: 1 }}>
                <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    format={labelFormat}
                    disableFuture={disableFuture}
                    slotProps={{
                        textField: {
                            size: 'small',
                            variant: 'outlined',
                        },
                    }}
                    minDate={startDate}
                />
            </FormControl>
        </Stack>
    );
}
