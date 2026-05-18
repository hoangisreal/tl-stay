import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchListings, type ListingsResponse } from '../services/listingService.ts';

const useListingsQuery = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<ListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const filters = Object.fromEntries(searchParams.entries());
    setLoading(true);
    setError('');
    fetchListings(filters)
      .then((res) => setData(res.data))
      .catch(() => setError('Không thể tải danh sách phòng'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  return { data, loading, error };
};

export default useListingsQuery;
