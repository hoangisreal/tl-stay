import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SearchBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const today = new Date().toISOString().split('T')[0];
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    params.set('page', '1');
    navigate(`/?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white border border-gray-200 rounded-2xl shadow-md px-4 py-3 w-full max-w-3xl"
    >
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-xs font-semibold text-gray-700">Địa điểm</span>
        <input
          type="text"
          placeholder="Tìm kiếm thành phố..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="text-sm outline-none text-gray-700 placeholder-gray-400"
        />
      </div>
      <div className="hidden sm:block w-px bg-gray-200 self-stretch" />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-gray-700">Nhận phòng</span>
        <input
          type="date"
          min={today}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="text-sm outline-none text-gray-700"
        />
      </div>
      <div className="hidden sm:block w-px bg-gray-200 self-stretch" />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-gray-700">Trả phòng</span>
        <input
          type="date"
          min={checkIn || today}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="text-sm outline-none text-gray-700"
        />
      </div>
      <div className="hidden sm:block w-px bg-gray-200 self-stretch" />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-gray-700">Khách</span>
        <input
          type="number"
          min={1}
          placeholder="1"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="text-sm outline-none text-gray-700 w-12"
        />
      </div>
      <button
        type="submit"
        className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl px-5 py-2.5 font-medium text-sm transition-colors shrink-0"
      >
        🔍 Tìm
      </button>
    </form>
  );
}
