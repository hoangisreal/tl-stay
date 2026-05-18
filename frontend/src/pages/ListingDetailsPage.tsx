import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchListingById, type Listing } from '../services/listingService.ts';
import BookingWidget from '../components/BookingWidget.tsx';

export default function ListingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  useEffect(() => {
    if (!id) return;
    fetchListingById(id)
      .then((res) => setListing(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;
  if (!listing) return <div className="flex justify-center py-20 text-gray-500">Không tìm thấy phòng</div>;

  const images = listing.images.length
    ? listing.images.map((img) => `${baseUrl}${img}`)
    : ['https://placehold.co/800x500?text=No+Image'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{listing.title}</h1>
      <p className="text-sm text-gray-500 mb-6">{listing.location.address}, {listing.location.city}, {listing.location.country}</p>

      <div className="mb-8">
        <img src={images[activeImg]} alt={listing.title} className="w-full h-80 object-cover rounded-2xl mb-2" />
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                onClick={() => setActiveImg(i)}
                className={`h-20 w-28 object-cover rounded-lg cursor-pointer shrink-0 transition ${i === activeImg ? 'ring-2 ring-rose-500' : 'opacity-70 hover:opacity-100'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <p className="font-semibold text-gray-800">
                {listing.bedrooms} phòng ngủ · {listing.beds} giường · {listing.bathrooms} phòng tắm · tối đa {listing.maxGuests} khách
              </p>
              <p className="text-sm text-gray-500">Chủ nhà: {listing.host.name}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold shrink-0">
              {listing.host.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-gray-800 mb-2">Mô tả</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>

          {listing.amenities.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-3">Tiện ích</h2>
              <div className="grid grid-cols-2 gap-2">
                {listing.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                    <span>✓</span> {a}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <BookingWidget listing={listing} />
        </div>
      </div>
    </div>
  );
}
