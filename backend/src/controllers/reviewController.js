import { z } from 'zod';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import { PAID_BOOKING_STATUSES } from '../utils/availability.js';
import { objectIdSchema } from '../utils/validators.js';
import { recomputeListingRating } from '../utils/reviewUtils.js';
import { logActivity } from '../utils/activityLogger.js';

const reviewSchema = z.object({
  booking: objectIdSchema,
  rating: z.coerce.number().int().min(1).max(5),
  cleanliness: z.coerce.number().int().min(1).max(5).optional(),
  accuracy: z.coerce.number().int().min(1).max(5).optional(),
  checkInRating: z.coerce.number().int().min(1).max(5).optional(),
  communication: z.coerce.number().int().min(1).max(5).optional(),
  location: z.coerce.number().int().min(1).max(5).optional(),
  value: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().min(5).max(2000),
});

const reviewParamsSchema = z.object({
  id: objectIdSchema,
});

const listingParamsSchema = z.object({
  listingId: objectIdSchema,
});

export const create = async (req, res, next) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { booking: bookingId, ...data } = parsed.data;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    if (booking.guest.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Only the guest can review this booking'));
    }
    if (!PAID_BOOKING_STATUSES.includes(booking.status)) {
      res.status(400);
      return next(new Error('Only completed paid bookings can be reviewed'));
    }
    if (new Date(booking.checkOut) > new Date()) {
      res.status(400);
      return next(new Error('You can review only after checkout'));
    }
    const existing = await Review.findOne({ booking: bookingId });
    if (existing) {
      res.status(409);
      return next(new Error('You have already reviewed this booking'));
    }

    let review;
    try {
      review = await Review.create({
        ...data,
        booking: bookingId,
        listing: booking.listing,
        guest: req.user._id,
      });
    } catch (err) {
      if (err?.code === 11000) {
        res.status(409);
        return next(new Error('You have already reviewed this booking'));
      }
      throw err;
    }
    await recomputeListingRating(booking.listing);
    const populated = await review.populate('guest', 'name avatarUrl');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const listByListing = async (req, res, next) => {
  try {
    const parsed = listingParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const listing = await Listing.findOne({ _id: parsed.data.listingId, isActive: true }).select('_id');
    if (!listing) {
      res.status(404);
      return next(new Error('Listing not found'));
    }
    const reviews = await Review.find({ listing: parsed.data.listingId })
      .populate('guest', 'name avatarUrl')
      .sort('-createdAt');
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const parsed = reviewParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const review = await Review.findById(parsed.data.id);
    if (!review) {
      res.status(404);
      return next(new Error('Review not found'));
    }
    if (review.guest.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Forbidden'));
    }
    const listingId = review.listing;
    await review.deleteOne();
    await recomputeListingRating(listingId);
    await logActivity(req.user._id, 'review.deleted', 'review', review._id, { listing: listingId }, req);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

export const myPendingReviews = async (req, res, next) => {
  try {
    const completedBookings = await Booking.find({
      guest: req.user._id,
      status: { $in: PAID_BOOKING_STATUSES },
      checkOut: { $lt: new Date() },
    })
      .populate('listing', 'title images location')
      .sort('-checkOut');
    const reviewedIds = await Review.find({
      booking: { $in: completedBookings.map((b) => b._id) },
    }).distinct('booking');
    const reviewedSet = new Set(reviewedIds.map((id) => id.toString()));
    const pending = completedBookings.filter((b) => !reviewedSet.has(b._id.toString()));
    res.json(pending);
  } catch (err) {
    next(err);
  }
};
