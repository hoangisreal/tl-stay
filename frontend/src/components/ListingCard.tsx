import { Link } from 'react-router-dom';
import type { Listing } from '../services/listingService.ts';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = listing.images[0]
    ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${listing.images[0]}`
    : 'https://placehold.co/400x300?text=No+Image';

  return (
    <Link to={`/listings/${listing._id}`} className="group block">
      <div className="overflow-hidden rounded-xl">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 flex-1 pr-2">
            {listing.title}
          </h3>
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
