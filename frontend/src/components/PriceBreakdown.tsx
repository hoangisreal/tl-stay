import type { PriceBreakdown as PB } from '../services/bookingService.ts';

interface PriceBreakdownProps {
  pricePerNight: number;
  breakdown: PB;
}

const fmt = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

export default function PriceBreakdown({ pricePerNight, breakdown }: PriceBreakdownProps) {
  return (
    <div className="space-y-2 text-sm text-gray-700">
      <div className="flex justify-between">
        <span>{fmt(pricePerNight)} × {breakdown.nights} đêm</span>
        <span>{fmt(breakdown.subtotal)}</span>
      </div>
      {breakdown.cleaningFee > 0 && (
        <div className="flex justify-between">
          <span>Phí dọn dẹp</span>
          <span>{fmt(breakdown.cleaningFee)}</span>
        </div>
      )}
      {!!breakdown.specialOfferDiscount && (
        <div className="flex justify-between text-green-700">
          <span>Ưu đãi đặc biệt</span>
          <span>-{fmt(breakdown.specialOfferDiscount)}</span>
        </div>
      )}
      {!!breakdown.monthlyDiscount && (
        <div className="flex justify-between text-green-700">
          <span>Giảm giá theo tháng</span>
          <span>-{fmt(breakdown.monthlyDiscount)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Phí dịch vụ</span>
        <span>{fmt(breakdown.serviceFee)}</span>
      </div>
      <div className="flex justify-between">
        <span>Thuế</span>
        <span>{fmt(breakdown.tax)}</span>
      </div>
      <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
        <span>Tổng cộng</span>
        <span>{fmt(breakdown.totalPrice)}</span>
      </div>
    </div>
  );
}
