import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWishlist } from '../services/wishlistService.ts';
import type { Listing } from '../services/listingService.ts';
import FavoriteButton from '../components/FavoriteButton.tsx';
import { resolveFirstImage } from '../lib/images.ts';
import useAuthStore from '../store/authStore.ts';

export default function WishlistPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const favoriteListings = useAuthStore((s) => s.user?.favoriteListings || []);

  useEffect(() => {
    fetchWishlist().then((res) => setListings(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setListings((prev) => prev.filter((l) => favoriteListings.includes(l._id)));
  }, [favoriteListings]);

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Danh sách yêu thích</h1>
      {listings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">❤️</p>
          <p>Bạn chưa có phòng yêu thích nào.</p>
          <Link to="/" className="text-rose-500 hover:underline text-sm mt-2 inline-block">Tìm phòng ngay</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={resolveFirstImage(listing.images)}
                  alt={listing.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 right-3">
                  <FavoriteButton listingId={listing._id} />
                </div>
              </div>
              <div className="p-4">
                <Link to={`/listings/${listing._id}`} className="font-semibold text-gray-800 hover:text-rose-500 line-clamp-1 block">
                  {listing.title}
                </Link>
                <p className="text-sm text-gray-500 mt-1">{listing.location.city}, {listing.location.country}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-gray-800">
                    {listing.pricePerNight.toLocaleString('vi-VN')}đ <span className="font-normal text-gray-500">/ đêm</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
