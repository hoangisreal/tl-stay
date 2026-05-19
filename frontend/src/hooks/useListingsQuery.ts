import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchListings, type ListingsResponse } from '../services/listingService.ts';
import { useDebounce } from './useDebounce.ts';

const useListingsQuery = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce the search params string so that rapid URL changes
  // (e.g. category tab + filter applied simultaneously) don't fire
  // multiple back-to-back API requests.
  const paramsString = useDebounce(searchParams.toString(), 300);

  useEffect(() => {
    const filters = Object.fromEntries(new URLSearchParams(paramsString).entries());
    setLoading(true);
    setError('');
    fetchListings(filters)
      .then((res) => setData(res.data))
      .catch(() => setError('Không thể tải danh sách phòng'))
      .finally(() => setLoading(false));
  }, [paramsString]);

  return { data, loading, error };
};

export default useListingsQuery;
