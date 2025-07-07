// In datefilters.ts
import { useCallback, useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useLocalStorage } from './localstorage';

export function useDateFilters(storageKey: string, defaultStartDate?: string, defaultEndDate?: string) {
    const [dates, setDates] = useLocalStorage<{
      startDate: string | null;
      endDate: string | null;
    }>(storageKey, { 
      startDate: defaultStartDate || dayjs().startOf('month').format('YYYY-MM-DD'), 
      endDate: defaultEndDate || dayjs().format('YYYY-MM-DD') 
    });

  const setDateFilters = useCallback((
    updater: (prev: { startDate: Dayjs | null; endDate: Dayjs | null }) => 
      { startDate: Dayjs | null; endDate: Dayjs | null }
  ) => {
    setDates(prev => {
      const current = {
        startDate: prev.startDate ? dayjs(prev.startDate) : null,
        endDate: prev.endDate ? dayjs(prev.endDate) : null,
      };
      const updated = updater(current);
      
      // Only update if dates actually changed
      const newStart = updated.startDate?.format('YYYY-MM-DD') || null;
      const newEnd = updated.endDate?.format('YYYY-MM-DD') || null;
      
      if (newStart !== prev.startDate || newEnd !== prev.endDate) {
        return {
          startDate: newStart,
          endDate: newEnd,
        };
      }
      return prev;
    });
  }, [setDates]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    startDate: dates.startDate,
    endDate: dates.endDate,
    setDateFilters,
  }), [dates.startDate, dates.endDate, setDateFilters]);
}