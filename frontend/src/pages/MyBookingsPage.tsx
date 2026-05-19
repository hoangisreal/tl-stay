import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyBookings, cancelBooking, type Booking } from '../services/bookingService.ts';
import Badge from '../components/Badge.tsx';
import PriceBreakdown from '../components/PriceBreakdown.tsx';
import { resolveFirstImage } from '../lib/images.ts';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBookings().then((res) => setBookings(res.data)).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Huỷ đặt phòng này?')) return;
    const { data } = await cancelBooking(id);
    setBookings((prev) => prev.map((b) => (b._id === id ? data : b)));
  };

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Đặt phòng của tôi</h1>
      {bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🗓</p>
          <p>Bạn chưa có đặt phòng nào.</p>
          <Link to="/" className="text-rose-500 hover:underline text-sm mt-2 inline-block">Tìm phòng ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const img = resolveFirstImage(booking.listing.images);
            const checkIn = new Date(booking.checkIn).toLocaleDateString('vi-VN');
            const checkOut = new Date(booking.checkOut).toLocaleDateString('vi-VN');
            return (
              <div key={booking._id} className="flex flex-col sm:flex-row gap-4 bg-white border border-gray-200 rounded-2xl p-4">
                <img src={img} alt={booking.listing.title} className="w-full sm:w-28 h-44 sm:h-20 object-cover rounded-xl shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <Link to={`/listings/${booking.listing._id}`} className="font-semibold text-gray-800 hover:text-rose-500 truncate block">
                    {booking.listing.title}
                  </Link>
                  <p className="text-sm text-gray-500">{booking.listing.location.city}</p>
                  <p className="text-sm text-gray-600">{checkIn} → {checkOut} · {booking.guests} khách</p>
                  <div className="flex items-center gap-3">
                    <Badge status={booking.status} />
                    <span className="text-sm font-semibold text-gray-800">{booking.totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {booking.nights > 0 && (
                    <PriceBreakdown pricePerNight={booking.listing.pricePerNight} breakdown={booking} />
                  )}
                </div>
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 self-start shrink-0"
                  >
                    Huỷ
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
