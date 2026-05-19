import Review from '../models/Review.js';
import Listing from '../models/Listing.js';

export const recomputeListingRating = async (listingId) => {
  const stats = await Review.aggregate([
    { $match: { listing: listingId } },
    { $group: { _id: '$listing', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await Listing.findByIdAndUpdate(listingId, {
    avgRating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
};
