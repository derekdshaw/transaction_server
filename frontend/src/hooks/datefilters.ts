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

/**
 * Retrieves the start and end dates from localStorage for a given key
 * @param storageKey The key used to store the date filters in localStorage
 * @returns An object containing startDate and endDate as Dayjs objects, or null if not found
 */
export function getDateFilters(storageKey: string): { startDate: Dayjs | null; endDate: Dayjs | null } | null {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    if (!parsed) return null;
    
    return {
      startDate: parsed.startDate ? dayjs(parsed.startDate) : null,
      endDate: parsed.endDate ? dayjs(parsed.endDate) : null
    };
  } catch (error) {
    console.error('Error retrieving date filters:', error);
    return null;
  }
}