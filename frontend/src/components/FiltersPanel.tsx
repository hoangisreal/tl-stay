import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AMENITIES_LIST } from '../lib/amenities.ts';

export default function FiltersPanel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [beds, setBeds] = useState(searchParams.get('beds') || '');
  const [bathrooms, setBathrooms] = useState(searchParams.get('bathrooms') || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get('amenities')?.split(',').filter(Boolean) || []
  );

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    if (bedrooms) params.set('bedrooms', bedrooms);
    else params.delete('bedrooms');
    if (beds) params.set('beds', beds);
    else params.delete('beds');
    if (bathrooms) params.set('bathrooms', bathrooms);
    else params.delete('bathrooms');
    if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));
    else params.delete('amenities');
    params.set('page', '1');
    navigate(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setBeds('');
    setBathrooms('');
    setSelectedAmenities([]);
    navigate('/');
  };

  return (
    <div className="space-y-3">
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
          onClick={() => setShowMore(!showMore)}
          className="w-full sm:w-auto border border-gray-300 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
        >
          {showMore ? 'Ẩn bộ lọc' : 'Thêm bộ lọc'}
        </button>
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

      {showMore && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Phòng ngủ</label>
              <input
                type="number"
                min="1"
                placeholder="Tối thiểu"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Giường</label>
              <input
                type="number"
                min="1"
                placeholder="Tối thiểu"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phòng tắm</label>
              <input
                type="number"
                min="1"
                placeholder="Tối thiểu"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tiện nghi</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AMENITIES_LIST.map(amenity => (
                <button
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                    selectedAmenities.includes(amenity)
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
