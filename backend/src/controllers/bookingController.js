import { z } from 'zod';
import Booking from '../models/Booking.js';
import BookingHold from '../models/BookingHold.js';
import Listing from '../models/Listing.js';
import { enumerateStayNights, hasOverlap } from '../utils/availability.js';
import { computeBreakdown } from '../utils/pricing.js';

const bookingSchema = z.object({
  listing: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int().min(1),
});

const isDuplicateHoldError = (err) =>
  err?.code === 11000 || err?.writeErrors?.some((writeErr) => writeErr?.code === 11000);

export const create = async (req, res, next) => {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { listing: listingId, checkIn, checkOut, guests } = parsed.data;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      res.status(400);
      return next(new Error('Invalid date format'));
    }
    if (checkInDate >= checkOutDate) {
      res.status(400);
      return next(new Error('Check-out must be after check-in'));
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      res.status(400);
      return next(new Error('Check-in cannot be in the past'));
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      res.status(404);
      return next(new Error('Listing not found'));
    }
    if (!listing.isActive) {
      res.status(400);
      return next(new Error('Listing is not available'));
    }
    if (guests > listing.maxGuests) {
      res.status(400);
      return next(new Error(`Maximum ${listing.maxGuests} guests allowed`));
    }

    if (await hasOverlap(listingId, checkIn, checkOut)) {
      res.status(409);
      return next(new Error('Dates are not available'));
    }

    const breakdown = computeBreakdown(
      checkIn,
      checkOut,
      listing.pricePerNight,
      listing.cleaningFee || 0
    );
    const booking = new Booking({
      listing: listingId,
      guest: req.user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      ...breakdown,
    });

    const heldDates = enumerateStayNights(checkInDate, checkOutDate);
    try {
      await BookingHold.insertMany(
        heldDates.map((date) => ({ listing: listingId, booking: booking._id, date })),
        { ordered: true }
      );
    } catch (err) {
      await BookingHold.deleteMany({ booking: booking._id });
      if (isDuplicateHoldError(err)) {
        res.status(409);
        return next(new Error('Dates are not available'));
      }
      throw err;
    }

    try {
      await booking.save();
    } catch (err) {
      await BookingHold.deleteMany({ booking: booking._id });
      throw err;
    }

    if (await hasOverlap(listingId, checkIn, checkOut, booking._id)) {
      await Promise.all([
        Booking.deleteOne({ _id: booking._id }),
        BookingHold.deleteMany({ booking: booking._id }),
      ]);
      res.status(409);
      return next(new Error('Dates are not available'));
    }

    const populated = await booking.populate([
      { path: 'listing', select: 'title images location pricePerNight' },
      { path: 'guest', select: 'name email' },
    ]);
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ guest: req.user._id })
      .populate('listing', 'title images location pricePerNight host')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

export const getHostBookings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ host: req.user._id }).select('_id');
    const listingIds = listings.map((l) => l._id);
    const bookings = await Booking.find({ listing: { $in: listingIds } })
      .populate('listing', 'title images location')
      .populate('guest', 'name email')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    const isGuest = booking.guest.toString() === req.user._id.toString();
    const listing = await Listing.findById(booking.listing);
    const isHost = listing?.host.toString() === req.user._id.toString();
    if (!isGuest && !isHost) {
      res.status(403);
      return next(new Error('Forbidden'));
    }
    booking.status = 'cancelled';
    await booking.save();
    await BookingHold.deleteMany({ booking: booking._id });
    const populated = await booking.populate([
      { path: 'listing', select: 'title images location pricePerNight host' },
      { path: 'guest', select: 'name email' },
    ]);
    res.json(populated);
  } catch (err) {
    next(err);
  }
};

export const quote = async (req, res, next) => {
  try {
    const { listing: listingId, checkIn, checkOut } = req.query;
    if (!listingId || !checkIn || !checkOut) {
      res.status(400);
      return next(new Error('listing, checkIn and checkOut are required'));
    }
    const listing = await Listing.findById(listingId).select('pricePerNight cleaningFee isActive');
    if (!listing) {
      res.status(404);
      return next(new Error('Listing not found'));
    }
    if (!listing.isActive) {
      res.status(400);
      return next(new Error('Listing is not available'));
    }
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      res.status(400);
      return next(new Error('Invalid date format'));
    }
    if (checkInDate >= checkOutDate) {
      res.status(400);
      return next(new Error('Check-out must be after check-in'));
    }
    const breakdown = computeBreakdown(checkIn, checkOut, listing.pricePerNight, listing.cleaningFee || 0);
    res.json(breakdown);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listing', 'title images location pricePerNight')
      .populate('guest', 'name email');
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    const isGuest = booking.guest._id.toString() === req.user._id.toString();
    const listing = await Listing.findById(booking.listing._id || booking.listing).select('host');
    const isHost = listing?.host.toString() === req.user._id.toString();
    if (!isGuest && !isHost) {
      res.status(403);
      return next(new Error('Forbidden'));
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
};
