import { z } from 'zod';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import BookingHold from '../models/BookingHold.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import PaymentEvent from '../models/PaymentEvent.js';
import {
  enumerateStayNights,
  hasOverlap,
  validateListingAvailability,
} from '../utils/availability.js';
import { computeBreakdown } from '../utils/pricing.js';
import { calculateRefund, canCancel } from '../utils/cancellation.js';
import { dateOnlySchema, objectIdSchema, parseDateOnly, todayUtcDateOnly } from '../utils/validators.js';
import { notifyBookingEvent } from '../utils/notifications.js';
import { logActivity } from '../utils/activityLogger.js';

const bookingSchema = z.object({
  listing: objectIdSchema,
  checkIn: dateOnlySchema,
  checkOut: dateOnlySchema,
  guests: z.coerce.number().int().min(1),
});

const quoteSchema = z.object({
  listing: objectIdSchema,
  checkIn: dateOnlySchema,
  checkOut: dateOnlySchema,
});

const paramsSchema = z.object({
  id: objectIdSchema,
});

const mockPaymentSchema = z.object({
  outcome: z.enum(['success', 'failure']).default('success'),
});

const webhookSchema = z.object({
  eventId: z.string().min(8),
  type: z.enum(['payment.succeeded', 'payment.failed']),
  paymentIntentId: z.string().min(8),
});

const isDuplicateHoldError = (err) =>
  err?.code === 11000 || err?.writeErrors?.some((writeErr) => writeErr?.code === 11000);

const firstClientOrigin = () =>
  (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)[0] || 'http://localhost:5173';

const buildMockPayment = (booking) => {
  const intentId = `pi_mock_${booking._id}_${crypto.randomBytes(8).toString('hex')}`;
  return {
    provider: 'mock',
    intentId,
    status: 'requires_payment',
    amount: booking.totalPrice,
    currency: 'VND',
    dueAt: new Date(Date.now() + 1000 * 60 * 15),
    checkoutUrl: `${firstClientOrigin()}/bookings/${booking._id}/confirmation?payment_intent=${intentId}`,
  };
};

const populateBooking = (booking) =>
  booking.populate([
    { path: 'listing', select: 'title images location pricePerNight host' },
    { path: 'guest', select: 'name email' },
  ]);

const applyPaymentEvent = async ({ paymentIntentId, type, eventId, payload }) => {
  const booking = await Booking.findOne({ 'payment.intentId': paymentIntentId }).populate([
    { path: 'listing', select: 'title images location pricePerNight host' },
    { path: 'guest', select: 'name email' },
  ]);
  if (!booking) {
    const err = new Error('Booking not found for payment intent');
    err.statusCode = 404;
    throw err;
  }

  let event;
  try {
    event = await PaymentEvent.create({
      eventId,
      type,
      booking: booking._id,
      paymentIntentId,
      payload,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return { booking, duplicate: true };
    }
    throw err;
  }

  if (type === 'payment.succeeded' && booking.status === 'unpaid') {
    booking.status = 'paid';
    booking.payment.status = 'paid';
    booking.payment.paidAt = new Date();
    await booking.save();
    await logActivity(booking.guest?._id || booking.guest, 'payment.succeeded', 'booking', booking._id, {
      paymentIntentId,
      eventId,
      amount: booking.totalPrice,
    });
    await notifyBookingEvent({
      booking,
      listing: booking.listing,
      guest: booking.guest,
      host: booking.listing?.host,
      type: 'booking_paid',
    });
  }

  if (type === 'payment.failed' && booking.status === 'unpaid') {
    booking.status = 'failed';
    booking.payment.status = 'failed';
    booking.payment.failedAt = new Date();
    await booking.save();
    await BookingHold.deleteMany({ booking: booking._id });
    await logActivity(booking.guest?._id || booking.guest, 'payment.failed', 'booking', booking._id, {
      paymentIntentId,
      eventId,
      amount: booking.totalPrice,
    });
    await notifyBookingEvent({
      booking,
      listing: booking.listing,
      guest: booking.guest,
      host: booking.listing?.host,
      type: 'booking_failed',
    });
  }

  event.processedAt = new Date();
  await event.save();
  return { booking, duplicate: false };
};

export const create = async (req, res, next) => {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { listing: listingId, checkIn, checkOut, guests } = parsed.data;
    const checkInDate = parseDateOnly(checkIn);
    const checkOutDate = parseDateOnly(checkOut);

    if (!checkInDate || !checkOutDate) {
      res.status(400);
      return next(new Error('Invalid date format'));
    }
    if (checkInDate >= checkOutDate) {
      res.status(400);
      return next(new Error('Check-out must be after check-in'));
    }
    const today = todayUtcDateOnly();
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
    
    // Check guest requirements
    const guest = await User.findById(req.user._id);
    const reqs = listing.guestRequirements;
    if (reqs?.verifiedEmail && !guest.verified?.email) {
      res.status(400);
      return next(new Error('Email verification required'));
    }
    if (reqs?.verifiedPhone && !guest.verified?.phone) {
      res.status(400);
      return next(new Error('Phone verification required'));
    }
    if (reqs?.verifiedId && !guest.verified?.id) {
      res.status(400);
      return next(new Error('ID verification required'));
    }
    
    if (guests > listing.maxGuests) {
      res.status(400);
      return next(new Error(`Maximum ${listing.maxGuests} guests allowed`));
    }
    const availabilityError = validateListingAvailability(listing, checkInDate, checkOutDate, today);
    if (availabilityError) {
      res.status(400);
      return next(new Error(availabilityError));
    }

    if (await hasOverlap(listingId, checkIn, checkOut)) {
      res.status(409);
      return next(new Error('Dates are not available'));
    }

    const breakdown = computeBreakdown(
      checkIn,
      checkOut,
      listing.pricePerNight,
      listing.cleaningFee || 0,
      listing
    );
    const booking = new Booking({
      listing: listingId,
      guest: req.user._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      ...breakdown,
    });
    booking.payment = buildMockPayment(booking);

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

    const populated = await populateBooking(booking);
    await notifyBookingEvent({
      booking: populated,
      listing: populated.listing,
      guest: populated.guest,
      host: populated.listing?.host,
      type: 'booking_created',
    });
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
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const booking = await Booking.findById(parsed.data.id);
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
    if (['cancelled', 'refunded'].includes(booking.status)) {
      return res.json(await populateBooking(booking));
    }
    if (['paid', 'confirmed'].includes(booking.status)) {
      const today = todayUtcDateOnly();
      if (new Date(booking.checkIn) <= today) {
        res.status(400);
        return next(new Error('Paid bookings can only be cancelled before check-in'));
      }
      const { refundAmount } = calculateRefund(booking, listing);
      booking.status = 'refunded';
      booking.payment.status = 'refunded';
      booking.payment.refundedAt = new Date();
      booking.payment.refundAmount = refundAmount;
    } else {
      booking.status = 'cancelled';
      booking.payment.status = 'cancelled';
    }
    booking.cancelledAt = new Date();
    await booking.save();
    await BookingHold.deleteMany({ booking: booking._id });
    const populated = await populateBooking(booking);
    await logActivity(req.user._id, populated.status === 'refunded' ? 'booking.refunded' : 'booking.cancelled', 'booking', populated._id, {
      status: populated.status,
      paymentStatus: populated.payment?.status,
    }, req);
    await notifyBookingEvent({
      booking: populated,
      listing: populated.listing,
      guest: populated.guest,
      host: populated.listing?.host,
      type: populated.status === 'refunded' ? 'booking_refunded' : 'booking_cancelled',
    });
    res.json(populated);
  } catch (err) {
    next(err);
  }
};

export const quote = async (req, res, next) => {
  try {
    const parsed = quoteSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { listing: listingId, checkIn, checkOut } = parsed.data;
    const listing = await Listing.findById(listingId).select(
      'pricePerNight cleaningFee isActive blockedDates minNights maxNights advanceNoticeDays maxAdvanceBookingDays checkInDays checkOutDays customPricing weekendPriceMultiplier monthlyDiscount specialOffers'
    );
    if (!listing) {
      res.status(404);
      return next(new Error('Listing not found'));
    }
    if (!listing.isActive) {
      res.status(400);
      return next(new Error('Listing is not available'));
    }
    const checkInDate = parseDateOnly(checkIn);
    const checkOutDate = parseDateOnly(checkOut);
    if (!checkInDate || !checkOutDate) {
      res.status(400);
      return next(new Error('Invalid date format'));
    }
    if (checkInDate >= checkOutDate) {
      res.status(400);
      return next(new Error('Check-out must be after check-in'));
    }
    const today = todayUtcDateOnly();
    if (checkInDate < today) {
      res.status(400);
      return next(new Error('Check-in cannot be in the past'));
    }
    const availabilityError = validateListingAvailability(listing, checkInDate, checkOutDate, today);
    if (availabilityError) {
      res.status(400);
      return next(new Error(availabilityError));
    }
    if (await hasOverlap(listingId, checkIn, checkOut)) {
      res.status(409);
      return next(new Error('Dates are not available'));
    }
    const breakdown = computeBreakdown(checkIn, checkOut, listing.pricePerNight, listing.cleaningFee || 0, listing);
    res.json(breakdown);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    // Populate listing with host so we can authorise without a second DB query
    const booking = await Booking.findById(parsed.data.id)
      .populate({ path: 'listing', select: 'title images location pricePerNight host' })
      .populate('guest', 'name email');
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    const isGuest = booking.guest._id.toString() === req.user._id.toString();
    const isHost = booking.listing?.host?.toString() === req.user._id.toString();
    if (!isGuest && !isHost) {
      res.status(403);
      return next(new Error('Forbidden'));
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

export const simulatePayment = async (req, res, next) => {
  try {
    const params = paramsSchema.safeParse(req.params);
    const body = mockPaymentSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400);
      return next(new Error((params.error || body.error).errors[0].message));
    }

    const booking = await Booking.findById(params.data.id);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    if (booking.guest.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Forbidden'));
    }
    if (!booking.payment?.intentId) {
      res.status(400);
      return next(new Error('Booking has no payment intent'));
    }
    if (booking.status !== 'unpaid') {
      return res.json(await populateBooking(booking));
    }

    const type = body.data.outcome === 'success' ? 'payment.succeeded' : 'payment.failed';
    const { booking: updated } = await applyPaymentEvent({
      paymentIntentId: booking.payment.intentId,
      type,
      eventId: `evt_mock_${booking._id}_${body.data.outcome}_${crypto.randomBytes(6).toString('hex')}`,
      payload: { source: 'mock_checkout', actor: req.user._id },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const paymentWebhook = async (req, res, next) => {
  try {
    const parsed = webhookSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { booking, duplicate } = await applyPaymentEvent({
      ...parsed.data,
      payload: req.body,
    });
    res.json({ received: true, duplicate, bookingId: booking._id });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};
