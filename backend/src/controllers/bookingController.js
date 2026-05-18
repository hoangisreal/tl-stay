import { z } from 'zod';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import { hasOverlap } from '../utils/availability.js';
import { calculateTotalPrice } from '../utils/pricing.js';

const bookingSchema = z.object({
  listing: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int().min(1),
});

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

    if (checkInDate >= checkOutDate) {
      res.status(400);
      return next(new Error('Check-out must be after check-in'));
    }
    if (checkInDate < new Date()) {
      res.status(400);
      return next(new Error('Check-in cannot be in the past'));
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      res.status(404);
      return next(new Error('Listing not found'));
    }
    if (guests > listing.maxGuests) {
      res.status(400);
      return next(new Error(`Maximum ${listing.maxGuests} guests allowed`));
    }

    const overlap = await hasOverlap(listingId, checkIn, checkOut);
    if (overlap) {
      res.status(409);
      return next(new Error('Dates are not available'));
    }

    const totalPrice = calculateTotalPrice(checkIn, checkOut, listing.pricePerNight);
    const booking = await Booking.create({
      listing: listingId,
      guest: req.user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalPrice,
    });

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
    res.json(booking);
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
    res.json(booking);
  } catch (err) {
    next(err);
  }
};
