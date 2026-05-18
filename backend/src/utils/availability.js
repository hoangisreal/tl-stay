import Booking from '../models/Booking.js';

export const hasOverlap = async (listingId, checkIn, checkOut, excludeBookingId = null) => {
  const query = {
    listing: listingId,
    status: { $ne: 'cancelled' },
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  const conflict = await Booking.findOne(query);
  return !!conflict;
};

export const getBookedRanges = async (listingId) => {
  const bookings = await Booking.find({
    listing: listingId,
    status: { $ne: 'cancelled' },
    checkOut: { $gte: new Date() },
  }).select('checkIn checkOut');
  return bookings.map((b) => ({ checkIn: b.checkIn, checkOut: b.checkOut }));
};
