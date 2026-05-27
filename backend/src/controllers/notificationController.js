import { z } from 'zod';
import Notification from '../models/Notification.js';
import { objectIdSchema } from '../utils/validators.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const idParamsSchema = z.object({
  id: objectIdSchema,
});

const populateNotification = (query) =>
  query
    .populate('booking', 'checkIn checkOut guests status totalPrice')
    .populate('listing', 'title images location pricePerNight');

export const listNotifications = async (req, res, next) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }

    const { page, limit } = parsed.data;
    const filter = { user: req.user._id };
    const [notifications, total, unreadCount] = await Promise.all([
      populateNotification(Notification.find(filter))
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, readAt: null }),
    ]);

    res.json({
      notifications,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, readAt: null });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const parsed = idParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }

    const notification = await populateNotification(
      Notification.findOneAndUpdate(
        { _id: parsed.data.id, user: req.user._id },
        { $set: { readAt: new Date() } },
        { new: true }
      )
    );
    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    res.json(notification);
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ message: 'Notifications marked as read', count: result.modifiedCount || 0 });
  } catch (err) {
    next(err);
  }
};
