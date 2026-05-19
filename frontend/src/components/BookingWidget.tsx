import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Listing } from '../services/listingService.ts';
import { createBooking, fetchPriceQuote, type PriceBreakdown as PriceBreakdownType } from '../services/bookingService.ts';
import useAuth from '../hooks/useAuth.ts';
import PriceBreakdown from './PriceBreakdown.tsx';
import { getApiError } from '../lib/getApiError.ts';

interface BookingWidgetProps {
  listing: Listing;
}

export default function BookingWidget({ listing }: BookingWidgetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<PriceBreakdownType | null>(null);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Use nights from server quote to avoid timezone issues; fall back to client estimate while loading
  const estimatedNights =
    checkIn && checkOut
      ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 0;
  const nights = quote?.nights ?? estimatedNights;

  useEffect(() => {
    if (!checkIn || !checkOut || estimatedNights <= 0) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);
    fetchPriceQuote({ listing: listing._id, checkIn, checkOut })
      .then((res) => {
        if (!cancelled) setQuote(res.data);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut, listing._id, estimatedNights]);

  const handleBook = async () => {
    if (!user) return navigate('/login');
    if (!checkIn || !checkOut || nights <= 0) {
      setError('Vui lòng chọn ngày nhận và trả phòng hợp lệ');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const { data } = await createBooking({ listing: listing._id, checkIn, checkOut, guests });
      navigate(`/bookings/${data._id}/confirmation`);
    } catch (err: unknown) {
      setError(getApiError(err, 'Đặt phòng thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-md lg:sticky lg:top-24">
      <p className="text-xl font-bold text-gray-800 mb-4">
        {listing.pricePerNight.toLocaleString('vi-VN')}đ
        <span className="text-sm font-normal text-gray-500"> / đêm</span>
      </p>
      <div className="border border-gray-300 rounded-xl overflow-hidden mb-3">
        <div className="grid grid-cols-2 divide-x divide-gray-300">
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-700">NHẬN PHÒNG</p>
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="text-sm outline-none w-full text-gray-700 mt-1"
            />
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-700">TRẢ PHÒNG</p>
            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="text-sm outline-none w-full text-gray-700 mt-1"
            />
          </div>
        </div>
        <div className="border-t border-gray-300 p-3">
          <p className="text-xs font-semibold text-gray-700">KHÁCH</p>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="text-sm outline-none w-full mt-1 text-gray-700"
          >
            {Array.from({ length: listing.maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} khách</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <button
        onClick={handleBook}
        disabled={loading}
        className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Đang đặt...' : user ? 'Đặt phòng' : 'Đăng nhập để đặt phòng'}
      </button>
      {nights > 0 && (
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          {quoteLoading ? (
            <p className="text-sm text-gray-500">Đang tính giá...</p>
          ) : quote ? (
            <PriceBreakdown pricePerNight={listing.pricePerNight} breakdown={quote} />
          ) : (
            <p className="text-sm text-gray-500">Không thể tính giá cho ngày đã chọn</p>
          )}
        </div>
      )}
    </div>
  );
}
