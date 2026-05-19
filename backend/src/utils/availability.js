import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';

export const ACTIVE_BOOKING_STATUSES = ['unpaid', 'paid', 'pending', 'confirmed'];
export const PAID_BOOKING_STATUSES = ['paid', 'confirmed'];

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
    status: { $in: ACTIVE_BOOKING_STATUSES },
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
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkOut: { $gte: new Date() },
  }).select('checkIn checkOut');
  return bookings.map((b) => ({ checkIn: b.checkIn, checkOut: b.checkOut }));
};

export const dateOnlyKey = (date) => new Date(date).toISOString().slice(0, 10);

export const normalizeBlockedDates = (dates = []) => {
  const unique = new Set();
  for (const value of dates) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) continue;
    date.setUTCHours(0, 0, 0, 0);
    unique.add(dateOnlyKey(date));
  }
  return Array.from(unique).sort().map((value) => new Date(`${value}T00:00:00.000Z`));
};

export const getAvailabilityRules = (listing) => ({
  minNights: listing.minNights || 1,
  maxNights: listing.maxNights || null,
  advanceNoticeDays: listing.advanceNoticeDays || 0,
  maxAdvanceBookingDays: listing.maxAdvanceBookingDays || 365,
  checkInDays: listing.checkInDays || [],
  checkOutDays: listing.checkOutDays || [],
});

export const validateListingAvailability = (listing, checkInDate, checkOutDate, today) => {
  const nights = enumerateStayNights(checkInDate, checkOutDate);
  const rules = getAvailabilityRules(listing);

  if (nights.length < rules.minNights) {
    return `Minimum stay is ${rules.minNights} night${rules.minNights === 1 ? '' : 's'}`;
  }
  if (rules.maxNights && nights.length > rules.maxNights) {
    return `Maximum stay is ${rules.maxNights} night${rules.maxNights === 1 ? '' : 's'}`;
  }

  const earliest = new Date(today);
  earliest.setUTCDate(earliest.getUTCDate() + rules.advanceNoticeDays);
  if (checkInDate < earliest) {
    return `This listing requires ${rules.advanceNoticeDays} day${rules.advanceNoticeDays === 1 ? '' : 's'} advance notice`;
  }

  const latest = new Date(today);
  latest.setUTCDate(latest.getUTCDate() + rules.maxAdvanceBookingDays);
  if (checkInDate > latest) {
    return `Bookings can be made at most ${rules.maxAdvanceBookingDays} days in advance`;
  }

  if (rules.checkInDays.length && !rules.checkInDays.includes(checkInDate.getUTCDay())) {
    return 'Check-in is not allowed on that day of week';
  }
  if (rules.checkOutDays.length && !rules.checkOutDays.includes(checkOutDate.getUTCDay())) {
    return 'Check-out is not allowed on that day of week';
  }

  const blocked = new Set((listing.blockedDates || []).map(dateOnlyKey));
  const blockedNight = nights.find((date) => blocked.has(dateOnlyKey(date)));
  if (blockedNight) {
    return 'Selected dates include a host-blocked date';
  }

  return null;
};

export const getListingsWithBlockedDates = async (checkIn, checkOut) => {
  const stayNights = enumerateStayNights(new Date(checkIn), new Date(checkOut));
  if (!stayNights.length) return [];
  return Listing.distinct('_id', { blockedDates: { $in: stayNights } });
};
