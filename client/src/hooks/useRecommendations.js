import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTripRecommendations } from '../services/api';

export function useRecommendations(initialOrigin = 'nyc', initialDates = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentDatesRef = useRef(initialDates);

  const load = useCallback(async (origin, dates) => {
    try {
      setLoading(true);
      const result = await fetchTripRecommendations(
        origin,
        dates?.departure,
        dates?.return
      );
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(initialOrigin, initialDates);
    currentDatesRef.current = initialDates;
  }, [initialOrigin, initialDates?.departure, initialDates?.return, load]);

  const refetch = useCallback(async (origin, dates) => {
    await load(origin || initialOrigin, dates || currentDatesRef.current);
  }, [load, initialOrigin]);

  return { data, loading, error, refetch };
}
