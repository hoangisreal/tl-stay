import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchListingById, type Listing } from '../services/listingService.ts';
import BookingWidget from '../components/BookingWidget.tsx';
import { resolveImageUrl } from '../lib/images.ts';
import ImageLightbox from '../components/ImageLightbox.tsx';
import ReviewList from '../components/ReviewList.tsx';
import RatingStars from '../components/RatingStars.tsx';
import FavoriteButton from '../components/FavoriteButton.tsx';
import useAuth from '../hooks/useAuth.ts';
import { fetchListingReviews, type Review } from '../services/reviewService.ts';

export default function ListingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetchListingById(id)
      .then((res) => setListing(res.data))
      .finally(() => setLoading(false));
    fetchListingReviews(id)
      .then((res) => setReviews(res.data))
      .finally(() => setReviewsLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20">Đang tải...</div>;
  if (!listing) return <div className="flex justify-center py-20 text-gray-500">Không tìm thấy phòng</div>;

  const images = listing.images.length
    ? listing.images.map(resolveImageUrl)
    : [resolveImageUrl(null)];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{listing.title}</h1>
          <p className="text-sm text-gray-500">{listing.location.address}, {listing.location.city}, {listing.location.country}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <RatingStars value={listing.avgRating || 0} size="sm" readOnly />
            <span className="text-sm text-gray-600">({listing.reviewCount || 0} đánh giá)</span>
          </div>
          {user && <FavoriteButton listingId={listing._id} />}
        </div>
      </div>

      <div className="mb-8">
        <img
          src={images[0]}
          alt={listing.title}
          className="w-full h-80 object-cover rounded-2xl cursor-pointer"
          onClick={() => openLightbox(0)}
        />
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                onClick={() => openLightbox(i)}
                className="h-20 w-28 object-cover rounded-lg cursor-pointer shrink-0 transition opacity-70 hover:opacity-100"
              />
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onChange={setLightboxIndex}
        />
      )}

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

          <div>
            <h2 className="font-semibold text-gray-800 mb-3">Đánh giá</h2>
            {reviewsLoading ? (
              <p className="text-sm text-gray-500">Đang tải đánh giá...</p>
            ) : (
              <ReviewList
                reviews={reviews}
                avgRating={listing.avgRating || 0}
                reviewCount={listing.reviewCount || 0}
              />
            )}
          </div>
        </div>

        <div>
          <BookingWidget listing={listing} />
        </div>
      </div>
    </div>
  );
}
