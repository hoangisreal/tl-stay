import Booking from '../models/Booking.js';

export const enumerateStayNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const dates = [];
  for (const d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
};

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
