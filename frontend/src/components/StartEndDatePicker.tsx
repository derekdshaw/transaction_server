import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDateFilters } from '../hooks/datefilters';
import { FormControl, FormLabel, Stack, Box } from '@mui/joy';

interface StartEndDatePickerProps {
    storageKey: string;
    defaultStartDate?: string;
    defaultEndDate?: string;
    onDatesChange?: (startDate: Dayjs, endDate: Dayjs) => void;
    className?: string;
    labelFormat?: string;
    disableFuture?: boolean;
    startDate?: Dayjs | string;
    endDate?: Dayjs | string;
}

export default function StartEndDatePicker({
    storageKey,
    defaultStartDate = dayjs().startOf('month').format('YYYY-MM-DD'),
    defaultEndDate = dayjs().format('YYYY-MM-DD'),
    onDatesChange,
    className = '',
    labelFormat = 'MM/DD/YYYY',
    disableFuture = true,
    startDate: controlledStartDate,
    endDate: controlledEndDate,
}: StartEndDatePickerProps) {
    // Use the date filters hook for state management
    const {
        startDate: startDateStr,
        endDate: endDateStr,
        setDateFilters
    } = useDateFilters(storageKey, defaultStartDate, defaultEndDate);

    // Memoized dayjs objects for the date pickers
    // Determine the actual date values: controlled or from hook
    const startDate = useMemo(() =>
        controlledStartDate
            ? dayjs(controlledStartDate)
            : (startDateStr ? dayjs(startDateStr) : dayjs(defaultStartDate)),
        [controlledStartDate, startDateStr, defaultStartDate]
    );
    const endDate = useMemo(() =>
        controlledEndDate
            ? dayjs(controlledEndDate)
            : (endDateStr ? dayjs(endDateStr) : dayjs(defaultEndDate)),
        [controlledEndDate, endDateStr, defaultEndDate]
    );

    // Handle date changes
        // Handle date changes
        const handleStartDateChange = useCallback((date: Dayjs | null) => {
            if (!date) return;
            if (controlledStartDate && onDatesChange) {
                onDatesChange(date, endDate);
            } else {
                setDateFilters(prev => ({
                    ...prev,
                    startDate: date
                }));
            }
        }, [controlledStartDate, onDatesChange, endDate, setDateFilters]);
    
        const handleEndDateChange = useCallback((date: Dayjs | null) => {
            if (!date) return;
            if (controlledEndDate && onDatesChange) {
                onDatesChange(startDate, date);
            } else {
                setDateFilters(prev => ({
                    ...prev,
                    endDate: date
                }));
            }
        }, [controlledEndDate, onDatesChange, startDate, setDateFilters]);

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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', alignContent: 'flex-start', flexWrap: 'wrap' }}>
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
        </Box>
    );
}
