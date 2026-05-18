import { Link } from 'react-router-dom';
import type { Listing } from '../services/listingService.ts';
import { resolveFirstImage } from '../lib/images.ts';
import FavoriteButton from './FavoriteButton.tsx';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = resolveFirstImage(listing.images);

  return (
    <Link to={`/listings/${listing._id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <FavoriteButton listingId={listing._id} className="absolute top-3 right-3 shadow-sm" />
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 flex-1">
            {listing.title}
          </h3>
          {listing.reviewCount > 0 && (
            <span className="text-xs text-gray-700 shrink-0">
              ★ {listing.avgRating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{listing.location.city}, {listing.location.country}</p>
        <p className="text-sm text-gray-800">
          <span className="font-semibold">{listing.pricePerNight.toLocaleString('vi-VN')}đ</span>
          <span className="text-gray-500"> / đêm</span>
        </p>
      </div>
    </Link>
  );
}
