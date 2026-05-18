import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar.tsx';
import FiltersPanel from '../components/FiltersPanel.tsx';
import ListingGrid from '../components/ListingGrid.tsx';
import Pagination from '../components/Pagination.tsx';
import LoadingSkeleton from '../components/LoadingSkeleton.tsx';
import EmptyState from '../components/EmptyState.tsx';
import ErrorState from '../components/ErrorState.tsx';
import useListingsQuery from '../hooks/useListingsQuery.ts';

export default function HomePage() {
  const { data, loading, error } = useListingsQuery();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-center">
        <SearchBar />
      </div>
      <FiltersPanel />
      {loading && <LoadingSkeleton />}
      {error && <ErrorState message={error} />}
      {!loading && !error && data && (
        <>
          {data.listings.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <p className="text-sm text-gray-500">{data.total} phòng được tìm thấy</p>
              <ListingGrid listings={data.listings} />
              <Pagination
                page={data.page}
                pages={data.pages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
