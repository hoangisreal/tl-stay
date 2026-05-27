import { z } from 'zod';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import BookingHold from '../models/BookingHold.js';
import Review from '../models/Review.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import ActivityLog from '../models/ActivityLog.js';
import { ACTIVE_BOOKING_STATUSES, PAID_BOOKING_STATUSES } from '../utils/availability.js';
import { objectIdSchema } from '../utils/validators.js';
import { recomputeListingRating } from '../utils/reviewUtils.js';
import { USER_ROLES, getPermissionsForRole } from '../config/permissions.js';
import { logActivity } from '../utils/activityLogger.js';

const idParamsSchema = z.object({
  id: objectIdSchema,
});

const roleSchema = z.object({
  role: z.enum(USER_ROLES),
});

const listingStatusSchema = z.object({
  isActive: z.boolean(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const activityLogQuerySchema = paginationSchema.extend({
  action: z.string().trim().max(120).optional(),
  resource: z.string().trim().max(80).optional(),
  user: z.string().trim().max(120).optional(),
});

const verifyHostSchema = z.object({
  email: z.boolean().optional(),
  phone: z.boolean().optional(),
  id: z.boolean().optional(),
});

const adminUserPayload = (user) => ({
  ...user.toObject(),
  permissions: getPermissionsForRole(user.role),
});

export const verifyHost = async (req, res, next) => {
  try {
    const parsedParams = idParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      res.status(400);
      return next(new Error(parsedParams.error.errors[0].message));
    }
    const parsedBody = verifyHostSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400);
      return next(new Error(parsedBody.error.errors[0].message));
    }
    const user = await User.findById(parsedParams.data.id).select('-passwordHash');
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    const updates = parsedBody.data;
    if (updates.email !== undefined) user.verified.email = updates.email;
    if (updates.phone !== undefined) user.verified.phone = updates.phone;
    if (updates.id !== undefined) user.verified.id = updates.id;
    await user.save();
    await logActivity(req.user._id, 'user.verified', 'user', user._id, { updates, targetRole: user.role }, req);
    res.json({ user: adminUserPayload(user) });
  } catch (err) {
    next(err);
  }
};

export const getStats = async (_req, res, next) => {
  try {
    const [
      users,
      hosts,
      guests,
      admins,
      listings,
      activeListings,
      inactiveListings,
      bookings,
      confirmedBookings,
      cancelledBookings,
      reviews,
      conversations,
      messages,
      revenueAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'host' }),
      User.countDocuments({ role: 'guest' }),
      User.countDocuments({ role: 'admin' }),
      Listing.countDocuments(),
      Listing.countDocuments({ isActive: true }),
      Listing.countDocuments({ isActive: false }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: ACTIVE_BOOKING_STATUSES } }),
      Booking.countDocuments({ status: 'cancelled' }),
      Review.countDocuments(),
      Conversation.countDocuments(),
      Message.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $in: PAID_BOOKING_STATUSES } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

    res.json({
      users,
      hosts,
      guests,
      admins,
      listings,
      activeListings,
      inactiveListings,
      bookings,
      confirmedBookings,
      cancelledBookings,
      reviews,
      conversations,
      messages,
      revenue: revenueAgg[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { page, limit } = parsed.data;
    const [users, total] = await Promise.all([
      User.find().select('-passwordHash').sort('-createdAt').skip((page - 1) * limit).limit(limit),
      User.countDocuments(),
    ]);
    res.json({ users: users.map(adminUserPayload), page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const params = idParamsSchema.safeParse(req.params);
    const body = roleSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400);
      return next(new Error((params.error || body.error).errors[0].message));
    }
    if (params.data.id === req.user._id.toString() && body.data.role !== 'admin') {
      res.status(400);
      return next(new Error('Admins cannot remove their own admin role'));
    }
    const user = await User.findById(params.data.id).select('-passwordHash');
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    const previousRole = user.role;
    user.role = body.data.role;
    await user.save();
    await logActivity(req.user._id, 'user.role_updated', 'user', user._id, { previousRole, role: user.role }, req);
    res.json(adminUserPayload(user));
  } catch (err) {
    next(err);
  }
};

export const listListings = async (req, res, next) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { page, limit } = parsed.data;
    const [listings, total] = await Promise.all([
      Listing.find()
        .populate('host', 'name email avatarUrl')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Listing.countDocuments(),
    ]);
    res.json({ listings, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

export const updateListingStatus = async (req, res, next) => {
  try {
    const params = idParamsSchema.safeParse(req.params);
    const body = listingStatusSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400);
      return next(new Error((params.error || body.error).errors[0].message));
    }
    const listing = await Listing.findByIdAndUpdate(
      params.data.id,
      { isActive: body.data.isActive },
      { new: true, runValidators: true }
    ).populate('host', 'name email avatarUrl');
    if (!listing) {
      res.status(404);
      return next(new Error('Listing not found'));
    }
    await logActivity(req.user._id, 'listing.status_updated', 'listing', listing._id, { isActive: listing.isActive }, req);
    res.json(listing);
  } catch (err) {
    next(err);
  }
};

export const listBookings = async (req, res, next) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { page, limit } = parsed.data;
    const [bookings, total] = await Promise.all([
      Booking.find()
        .populate('listing', 'title images location host')
        .populate('guest', 'name email')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(),
    ]);
    res.json({ bookings, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const parsed = idParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const booking = await Booking.findById(parsed.data.id);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }
    if (['paid', 'confirmed'].includes(booking.status)) {
      booking.status = 'refunded';
      booking.payment.status = 'refunded';
      booking.payment.refundedAt = new Date();
      booking.payment.refundAmount = booking.totalPrice;
    } else {
      booking.status = 'cancelled';
      booking.payment.status = 'cancelled';
    }
    booking.cancelledAt = new Date();
    await booking.save();
    await BookingHold.deleteMany({ booking: booking._id });
    await logActivity(req.user._id, booking.status === 'refunded' ? 'booking.refunded' : 'booking.cancelled', 'booking', booking._id, {
      status: booking.status,
      paymentStatus: booking.payment?.status,
    }, req);
    const populated = await booking.populate([
      { path: 'listing', select: 'title images location host' },
      { path: 'guest', select: 'name email' },
    ]);
    res.json(populated);
  } catch (err) {
    next(err);
  }
};

export const listReviews = async (req, res, next) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { page, limit } = parsed.data;
    const [reviews, total] = await Promise.all([
      Review.find()
        .populate('listing', 'title location')
        .populate('guest', 'name email avatarUrl')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments(),
    ]);
    res.json({ reviews, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const parsed = idParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const review = await Review.findById(parsed.data.id);
    if (!review) {
      res.status(404);
      return next(new Error('Review not found'));
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

export const listMessages = async (req, res, next) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { page, limit } = parsed.data;
    const [messages, total] = await Promise.all([
      Message.find()
        .populate({
          path: 'conversation',
          select: 'listing host guest',
          populate: [
            { path: 'listing', select: 'title location' },
            { path: 'host', select: 'name email avatarUrl' },
            { path: 'guest', select: 'name email avatarUrl' },
          ],
        })
        .populate('sender', 'name email avatarUrl')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Message.countDocuments(),
    ]);
    res.json({ messages, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

export const getActivityLogs = async (req, res, next) => {
  try {
    const parsed = activityLogQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { page, limit, action, resource, user } = parsed.data;
    const filter = {};
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (resource) filter.resource = { $regex: resource, $options: 'i' };
    if (user) {
      if (objectIdSchema.safeParse(user).success) {
        filter.user = user;
      } else {
        const matchedUsers = await User.find({
          $or: [
            { name: { $regex: user, $options: 'i' } },
            { email: { $regex: user, $options: 'i' } },
          ],
        }).select('_id');
        filter.user = { $in: matchedUsers.map((item) => item._id) };
      }
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('user', 'name email role')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      ActivityLog.countDocuments(filter),
    ]);
    res.json({ logs, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};
