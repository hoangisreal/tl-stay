import { useEffect, useState } from 'react';
import { fetchMyListings, createListing, updateListing, deleteListing, type Listing } from '../services/listingService.ts';
import { fetchHostAnalytics, type HostAnalytics } from '../services/analyticsService.ts';
import ListingForm from '../components/ListingForm.tsx';
import { resolveFirstImage } from '../lib/images.ts';

export default function HostDashboardPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [analytics, setAnalytics] = useState<HostAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Listing | null>(null);

  const loadListings = () => {
    Promise.all([
      fetchMyListings(),
      fetchHostAnalytics().catch(() => ({ data: null })),
    ]).then(([listingRes, analyticsRes]) => {
      setListings(listingRes.data);
      setAnalytics(analyticsRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadListings(); }, []);

  const handleSubmit = async (formData: FormData) => {
    if (editTarget) {
      await updateListing(editTarget._id, formData);
    } else {
      await createListing(formData);
    }
    setShowForm(false);
    setEditTarget(null);
    loadListings();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá phòng này?')) return;
    await deleteListing(id);
    setListings((prev) => prev.filter((l) => l._id !== id));
  };

  const openCreate = () => { setEditTarget(null); setShowForm(true); };
  const openEdit = (listing: Listing) => { setEditTarget(listing); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditTarget(null); };

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">
          {editTarget ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
        </h1>
        <ListingForm listing={editTarget ?? undefined} onSubmit={handleSubmit} onCancel={closeForm} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý phòng</h1>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + Thêm phòng
        </button>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Phòng active</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.listings}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Đặt phòng</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.bookings}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Doanh thu</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.revenue.toLocaleString('vi-VN')}đ</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">Đánh giá</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.avgRating.toFixed(1)}/5</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Đang tải...</p>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🏠</p>
          <p>Bạn chưa có phòng nào. Hãy thêm phòng đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const img = resolveFirstImage(listing.images);
            return (
              <div key={listing._id} className="flex flex-col sm:flex-row gap-4 bg-white border border-gray-200 rounded-2xl p-4 sm:items-center">
                <img src={img} alt={listing.title} className="w-full sm:w-28 h-44 sm:h-20 object-cover rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{listing.title}</h3>
                  <p className="text-sm text-gray-500">{listing.location.city} · {listing.pricePerNight.toLocaleString('vi-VN')}đ/đêm · tối đa {listing.maxGuests} khách</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(listing)}
                    className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(listing._id)}
                    className="text-sm border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
