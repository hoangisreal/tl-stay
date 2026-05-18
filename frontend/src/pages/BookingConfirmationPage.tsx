import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBookingById, type Booking } from '../services/bookingService.ts';

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchBookingById(id).then((res) => setBooking(res.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;
  if (!booking) return <div className="flex justify-center py-20 text-gray-500">Không tìm thấy đặt phòng</div>;

  const checkIn = new Date(booking.checkIn).toLocaleDateString('vi-VN');
  const checkOut = new Date(booking.checkOut).toLocaleDateString('vi-VN');

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt phòng thành công!</h1>
        <p className="text-gray-500 text-sm mb-6">Cảm ơn bạn đã đặt phòng tại TL-Stay.</p>
        <div className="text-left bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-6">
          <p><span className="font-medium text-gray-700">Phòng:</span> {booking.listing.title}</p>
          <p><span className="font-medium text-gray-700">Nhận phòng:</span> {checkIn}</p>
          <p><span className="font-medium text-gray-700">Trả phòng:</span> {checkOut}</p>
          <p><span className="font-medium text-gray-700">Số khách:</span> {booking.guests}</p>
          <p><span className="font-medium text-gray-700">Tổng tiền:</span> {booking.totalPrice.toLocaleString('vi-VN')}đ</p>
        </div>
        <div className="flex gap-3">
          <Link to="/my-bookings" className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-medium py-2.5 rounded-xl text-sm transition-colors text-center">
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
