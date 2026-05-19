import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBookingById, simulatePayment, type Booking } from '../services/bookingService.ts';
import PriceBreakdown from '../components/PriceBreakdown.tsx';
import Badge from '../components/Badge.tsx';
import { getApiError } from '../lib/getApiError.ts';

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchBookingById(id).then((res) => setBooking(res.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;
  if (!booking) return <div className="flex justify-center py-20 text-gray-500">Không tìm thấy đặt phòng</div>;

  const checkIn = new Date(booking.checkIn).toLocaleDateString('vi-VN');
  const checkOut = new Date(booking.checkOut).toLocaleDateString('vi-VN');
  const canPay = booking.status === 'unpaid';

  const handlePay = async () => {
    setPaying(true);
    setError('');
    try {
      const { data } = await simulatePayment(booking._id, 'success');
      setBooking(data);
    } catch (err: unknown) {
      setError(getApiError(err, 'Thanh toán thất bại'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {canPay ? 'Hoàn tất thanh toán' : 'Thông tin đặt phòng'}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {canPay ? 'Chỗ được giữ tạm thời trong khi chờ thanh toán.' : 'Cảm ơn bạn đã đặt phòng tại TL-Stay.'}
        </p>
        <div className="text-left bg-gray-50 rounded-xl p-4 space-y-4 text-sm mb-6">
          <div className="space-y-2">
            <p><span className="font-medium text-gray-700">Phòng:</span> {booking.listing.title}</p>
            <p><span className="font-medium text-gray-700">Nhận phòng:</span> {checkIn}</p>
            <p><span className="font-medium text-gray-700">Trả phòng:</span> {checkOut}</p>
            <p><span className="font-medium text-gray-700">Số khách:</span> {booking.guests}</p>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Trạng thái:</span>
              <Badge status={booking.status} />
            </div>
          </div>
          {booking.nights > 0 && (
            <PriceBreakdown pricePerNight={booking.listing.pricePerNight} breakdown={booking} />
          )}
        </div>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        {canPay && (
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors mb-3"
          >
            {paying ? 'Đang thanh toán...' : `Thanh toán ${booking.totalPrice.toLocaleString('vi-VN')}đ`}
          </button>
        )}
        <div className="flex gap-3">
          <Link to="/my-bookings" className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors text-center">
            Xem đặt phòng
          </Link>
          <Link to="/" className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors text-center">
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
