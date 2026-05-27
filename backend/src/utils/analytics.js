import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import Review from '../models/Review.js';

export const getOverviewStats = async () => {
  const [totalBookings, totalRevenue, totalListings, totalUsers] = await Promise.all([
    Booking.countDocuments(),
    Booking.aggregate([
      { $match: { status: { $in: ['paid', 'confirmed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]).then(res => res[0]?.total || 0),
    Listing.countDocuments({ isActive: true }),
    User.countDocuments(),
  ]);
  return { totalBookings, totalRevenue, totalListings, totalUsers };
};

export const getRevenueByMonth = async (months = 6) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  return Booking.aggregate([
    { $match: { status: { $in: ['paid', 'confirmed'] }, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};

export const getTopListings = async (limit = 10) => {
  return Listing.find({ isActive: true })
    .sort({ reviewCount: -1, avgRating: -1 })
    .limit(limit)
    .select('title pricePerNight avgRating reviewCount images')
    .populate('host', 'name');
};

export const getBookingsByStatus = async () => {
  return Booking.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
};

export const getHostStats = async (hostId) => {
  const [listings, bookings, revenue, avgRating] = await Promise.all([
    Listing.countDocuments({ host: hostId, isActive: true }),
    Booking.countDocuments({ listing: { $in: await Listing.find({ host: hostId }).distinct('_id') } }),
    Booking.aggregate([
      { $lookup: { from: 'listings', localField: 'listing', foreignField: '_id', as: 'listingData' } },
      { $match: { 'listingData.host': hostId, status: { $in: ['paid', 'confirmed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]).then(res => res[0]?.total || 0),
    Listing.aggregate([
      { $match: { host: hostId } },
      { $group: { _id: null, avg: { $avg: '$avgRating' } } },
    ]).then(res => res[0]?.avg || 0),
  ]);
  return { listings, bookings, revenue, avgRating: Math.round(avgRating * 10) / 10 };
};
