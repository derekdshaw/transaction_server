import React, { useState, useMemo, useCallback } from "react";
import StartEndDatePicker from "./StartEndDatePicker";
import { Button, Typography, CircularProgress, Alert, Box, Stack, Sheet } from "@mui/joy";


import { getDateFilters } from '../hooks/datefilters';
import dayjs, { Dayjs } from 'dayjs';

import { styled } from '@mui/joy/styles';

const Item = styled(Sheet)(({ theme }) => ({
  ...theme.typography['body-sm'],
  textAlign: 'center',
  fontWeight: theme.fontWeight.md,
  color: theme.vars.palette.text.secondary,
  border: '1px solid',
  borderColor: theme.palette.divider,
  padding: theme.spacing(1),
  borderRadius: theme.radius.md,
}));

const REC_DATE_FILTERS_STORAGE_KEY = 'recommendationsDateFilters';
const agent_endpoint = import.meta.env.AGENT_API_URL || "http://localhost:8082";
const RECOMMENDATION_API_URL = agent_endpoint + "/recommendations";

type Recommendation = {
  description: string;
  actions: string[];
};

export default function Recommendations() {
  //let recommendations: { description: string; actions: string[] }[] = [];
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string>("");

  // Initialize with default dates first, then update from localStorage if available
  const [dateRange, setDateRange] = useState(() => {
    const savedDates = getDateFilters(REC_DATE_FILTERS_STORAGE_KEY);
    return {
      startDate: savedDates?.startDate || dayjs().startOf('month'),
      endDate: savedDates?.endDate || dayjs()
    };
  });

  // Memoize the date strings to prevent unnecessary refetches
  const startDateStr = useMemo(() => dateRange.startDate.format('YYYY-MM-DD'), [dateRange.startDate]);
  const endDateStr = useMemo(() => dateRange.endDate.format('YYYY-MM-DD'), [dateRange.endDate]);

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

  const handleGetRecommendations = async () => {
    setLoading(true);
    setError("");
    setRecommendations([]);
    try {
      const response = await fetch(RECOMMENDATION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1, use_external_agent: true, start_date: dateRange.startDate.format('YYYY-MM-DD'), end_date: dateRange.endDate.format('YYYY-MM-DD') }),
      });
      if (!response.ok) throw new Error("Failed to fetch recommendations");

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography level="title-lg">
          Savings Recommendations
        </Typography>
        <StartEndDatePicker
          storageKey={REC_DATE_FILTERS_STORAGE_KEY}
          onDatesChange={handleDateRangeChange}
          className="w-full" />
        <Button
          variant="outlined"
          onClick={handleGetRecommendations}
          disabled={loading}
          sx={{ height: '40px', }}
        >
          Get Recommendations
        </Button>
      </Box>
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>}
      {error && <Alert color="danger" sx={{ mb: 3 }}>
        Error getting recommendations: {error}
      </Alert>}
      {recommendations.length > 0 && (
        <Box>
          <Typography level="title-lg">
            Here are your savings recommendations:
          </Typography>
          {recommendations.map((rec, idx) => (
            <Box key={idx} sx={{ mb: 3 }}>
              <div>
                <Typography level="title-md">{rec.description}</Typography>
                <Stack spacing={1} sx={{ mb: 3 }}>
                  {rec.actions.map((action, i) => (
                    <Item>{action}</Item>
                  ))}
                </Stack>
              </div>
            </Box>
          ))}
        </Box>
      )}
    </Box>
)};
