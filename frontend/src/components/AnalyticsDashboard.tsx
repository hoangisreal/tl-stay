import { useEffect, useState } from 'react';
import {
  fetchAnalyticsOverview,
  fetchAnalyticsRevenue,
  type OverviewStats,
  type RevenueData,
} from '../services/analyticsService.ts';

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAnalyticsOverview(),
      fetchAnalyticsRevenue(6),
    ]).then(([overviewRes, revenueRes]) => {
      setOverview(overviewRes.data);
      setRevenue(revenueRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Phân tích</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Tổng đặt phòng</p>
          <p className="text-2xl font-bold text-gray-800">{overview?.totalBookings || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Doanh thu</p>
          <p className="text-2xl font-bold text-gray-800">{(overview?.totalRevenue || 0).toLocaleString()}đ</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Listings</p>
          <p className="text-2xl font-bold text-gray-800">{overview?.totalListings || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Người dùng</p>
          <p className="text-2xl font-bold text-gray-800">{overview?.totalUsers || 0}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Doanh thu 6 tháng</h2>
        <div className="space-y-2">
          {revenue.map((item) => (
            <div key={`${item._id.year}-${item._id.month}`} className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Tháng {item._id.month}/{item._id.year}</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{item.revenue.toLocaleString()}đ</p>
                <p className="text-xs text-gray-500">{item.count} đặt phòng</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
