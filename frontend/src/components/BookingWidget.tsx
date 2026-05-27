import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAvailability, type AvailabilityResponse, type Listing } from '../services/listingService.ts';
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
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const dateOnly = (value: string | Date) => new Date(value).toISOString().slice(0, 10);
  const addDays = (value: string, days: number) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const enumerateDates = (start: string, end: string) => {
    const dates: string[] = [];
    const cursor = new Date(`${start}T00:00:00.000Z`);
    const limit = new Date(`${end}T00:00:00.000Z`);
    for (; cursor < limit; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    return dates;
  };

  useEffect(() => {
    let cancelled = false;
    fetchAvailability(listing._id)
      .then((res) => {
        if (!cancelled) setAvailability(res.data);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      });
    return () => {
      cancelled = true;
    };
  }, [listing._id]);

  const unavailableDates = new Set([
    ...(availability?.blockedDates || []),
    ...(availability?.bookedRanges || []).flatMap((range) => enumerateDates(dateOnly(range.checkIn), dateOnly(range.checkOut))),
  ]);
  const guestRequirements = listing.guestRequirements || {};
  const requirementLabels = [
    guestRequirements.verifiedEmail ? 'email đã xác thực' : '',
    guestRequirements.verifiedPhone ? 'số điện thoại đã xác thực' : '',
    guestRequirements.verifiedId ? 'giấy tờ tùy thân đã xác thực' : '',
  ].filter(Boolean);
  const missingRequirements = user
    ? [
        guestRequirements.verifiedEmail && !user.verified?.email ? 'email' : '',
        guestRequirements.verifiedPhone && !user.verified?.phone ? 'số điện thoại' : '',
        guestRequirements.verifiedId && !user.verified?.id ? 'giấy tờ tùy thân' : '',
      ].filter(Boolean)
    : [];

  const minCheckIn = availability ? addDays(today, availability.rules.advanceNoticeDays) : today;
  const maxCheckIn = availability ? addDays(today, availability.rules.maxAdvanceBookingDays) : undefined;

  // Use nights from server quote to avoid timezone issues; fall back to client estimate while loading
  const estimatedNights =
    checkIn && checkOut
      ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 0;
  const nights = quote?.nights ?? estimatedNights;

  const selectedRangeError = (() => {
    if (!checkIn || !checkOut || !availability) return '';
    if (enumerateDates(checkIn, checkOut).some((date) => unavailableDates.has(date))) {
      return 'Khoảng ngày đã chọn có ngày không khả dụng';
    }
    if (availability.rules.checkInDays.length && !availability.rules.checkInDays.includes(new Date(`${checkIn}T00:00:00.000Z`).getUTCDay())) {
      return 'Ngày nhận phòng này không được chủ nhà mở lịch';
    }
    if (availability.rules.checkOutDays.length && !availability.rules.checkOutDays.includes(new Date(`${checkOut}T00:00:00.000Z`).getUTCDay())) {
      return 'Ngày trả phòng này không được chủ nhà mở lịch';
    }
    if (availability.rules.minNights && estimatedNights < availability.rules.minNights) {
      return `Tối thiểu ${availability.rules.minNights} đêm`;
    }
    if (availability.rules.maxNights && estimatedNights > availability.rules.maxNights) {
      return `Tối đa ${availability.rules.maxNights} đêm`;
    }
    return '';
  })();

  useEffect(() => {
    if (!checkIn || !checkOut || estimatedNights <= 0 || selectedRangeError) {
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
  }, [checkIn, checkOut, listing._id, estimatedNights, selectedRangeError]);

  const handleBook = async () => {
    if (!user) return navigate('/login');
    if (!checkIn || !checkOut || nights <= 0) {
      setError('Vui lòng chọn ngày nhận và trả phòng hợp lệ');
      return;
    }
    if (selectedRangeError) {
      setError(selectedRangeError);
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
              min={minCheckIn}
              max={maxCheckIn}
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
              max={maxCheckIn}
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
      {selectedRangeError && <p className="text-xs text-red-500 mb-3">{selectedRangeError}</p>}
      {availability && unavailableDates.size > 0 && (
        <p className="text-xs text-gray-500 mb-3">Các ngày đã đặt hoặc bị chủ nhà khoá sẽ không thể thanh toán.</p>
      )}
      {requirementLabels.length > 0 && (
        <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <p>Chủ nhà yêu cầu {requirementLabels.join(', ')}.</p>
          {missingRequirements.length > 0 && (
            <p className="mt-1 text-blue-700">Tài khoản hiện thiếu: {missingRequirements.join(', ')}.</p>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <button
        onClick={handleBook}
        disabled={loading || !!selectedRangeError}
        className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Đang giữ chỗ...' : user ? 'Giữ chỗ và thanh toán' : 'Đăng nhập để đặt phòng'}
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
