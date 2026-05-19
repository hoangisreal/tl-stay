import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function FiltersPanel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    params.set('page', '1');
    navigate(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    navigate('/');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-full sm:w-auto">
        <span className="text-xs text-gray-500">Giá từ</span>
        <input
          type="number"
          placeholder="0"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-full sm:w-24 text-sm outline-none"
        />
        <span className="text-xs text-gray-500">–</span>
        <input
          type="number"
          placeholder="Không giới hạn"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-full sm:w-28 text-sm outline-none"
        />
        <span className="text-xs text-gray-500">đ</span>
      </div>
      <button
        onClick={applyFilters}
        className="w-full sm:w-auto bg-gray-800 text-white text-sm px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors"
      >
        Lọc
      </button>
      {(searchParams.size > 0) && (
        <button
          onClick={clearFilters}
          className="text-sm text-rose-500 hover:underline"
        >
          Xoá bộ lọc
        </button>
      )}
    </div>
  );
}
