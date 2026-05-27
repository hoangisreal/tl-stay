import { z } from 'zod';
import Booking from '../models/Booking.js';
import Conversation from '../models/Conversation.js';
import Listing from '../models/Listing.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { ACTIVE_BOOKING_STATUSES } from '../utils/availability.js';
import { objectIdSchema } from '../utils/validators.js';
import { logActivity } from '../utils/activityLogger.js';

const idParamsSchema = z.object({
  id: objectIdSchema,
});

const createConversationSchema = z.object({
  listing: objectIdSchema,
  guest: objectIdSchema.optional(),
});

const listMessagesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  after: z.string().datetime().optional(),
});

const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

const isParticipant = (conversation, userId) =>
  conversation.host.toString() === userId.toString() || conversation.guest.toString() === userId.toString();

const populateConversation = (query) =>
  query
    .populate('listing', 'title images location pricePerNight isActive')
    .populate('host', 'name email avatarUrl')
    .populate('guest', 'name email avatarUrl');

const attachConversationMeta = async (conversation, userId) => {
  const [lastMessage, unreadCount] = await Promise.all([
    Message.findOne({ conversation: conversation._id }).populate('sender', 'name avatarUrl').sort('-createdAt'),
    Message.countDocuments({ conversation: conversation._id, sender: { $ne: userId }, readAt: null }),
  ]);
  const obj = conversation.toObject();
  obj.lastMessage = lastMessage;
  obj.unreadCount = unreadCount;
  return obj;
};

export const listConversations = async (req, res, next) => {
  try {
    const conversations = await populateConversation(
      Conversation.find({
        $or: [{ host: req.user._id }, { guest: req.user._id }],
      }).sort('-lastMessageAt')
    );
    const withMeta = await Promise.all(conversations.map((conversation) => attachConversationMeta(conversation, req.user._id)));
    res.json(withMeta);
  } catch (err) {
    next(err);
  }
};

export const createOrGetConversation = async (req, res, next) => {
  try {
    const parsed = createConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }

    const listing = await Listing.findById(parsed.data.listing);
    if (!listing) {
      res.status(404);
      return next(new Error('Listing not found'));
    }

    let hostId = listing.host;
    let guestId = req.user._id;

    if (req.user.role === 'guest') {
      if (!listing.isActive) {
        res.status(400);
        return next(new Error('Listing is not available'));
      }
      if (listing.host.toString() === req.user._id.toString()) {
        res.status(400);
        return next(new Error('Hosts cannot message themselves'));
      }
    } else if (req.user.role === 'host') {
      if (listing.host.toString() !== req.user._id.toString()) {
        res.status(403);
        return next(new Error('Forbidden'));
      }
      if (!parsed.data.guest) {
        res.status(400);
        return next(new Error('Guest is required'));
      }
      const guest = await User.findOne({ _id: parsed.data.guest, role: 'guest' });
      if (!guest) {
        res.status(404);
        return next(new Error('Guest not found'));
      }
      const booking = await Booking.findOne({
        listing: listing._id,
        guest: guest._id,
        status: { $in: ACTIVE_BOOKING_STATUSES },
      });
      if (!booking) {
        res.status(403);
        return next(new Error('Host can only message guests with active booking history'));
      }
      guestId = guest._id;
      hostId = req.user._id;
    } else {
      res.status(403);
      return next(new Error('Forbidden'));
    }

    const conversation = await Conversation.findOneAndUpdate(
      { listing: listing._id, host: hostId, guest: guestId },
      { $setOnInsert: { listing: listing._id, host: hostId, guest: guestId, lastMessageAt: new Date() } },
      { new: true, upsert: true }
    );
    const populated = await populateConversation(Conversation.findById(conversation._id));
    res.status(201).json(await attachConversationMeta(populated, req.user._id));
  } catch (err) {
    next(err);
  }
};

export const listMessages = async (req, res, next) => {
  try {
    const params = idParamsSchema.safeParse(req.params);
    const query = listMessagesSchema.safeParse(req.query);
    if (!params.success || !query.success) {
      res.status(400);
      return next(new Error((params.error || query.error).errors[0].message));
    }

    const conversation = await Conversation.findById(params.data.id);
    if (!conversation) {
      res.status(404);
      return next(new Error('Conversation not found'));
    }
    if (!isParticipant(conversation, req.user._id)) {
      res.status(403);
      return next(new Error('Forbidden'));
    }

    const filter = { conversation: conversation._id };
    if (query.data.after) filter.createdAt = { $gt: new Date(query.data.after) };
    const messages = await Message.find(filter)
      .populate('sender', 'name avatarUrl')
      .sort('createdAt')
      .limit(query.data.limit);
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const params = idParamsSchema.safeParse(req.params);
    const body = sendMessageSchema.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400);
      return next(new Error((params.error || body.error).errors[0].message));
    }

    const conversation = await Conversation.findById(params.data.id);
    if (!conversation) {
      res.status(404);
      return next(new Error('Conversation not found'));
    }
    if (!isParticipant(conversation, req.user._id)) {
      res.status(403);
      return next(new Error('Forbidden'));
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      body: body.data.body,
    });
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    await logActivity(req.user._id, 'message.sent', 'message', message._id, { conversation: conversation._id }, req);
    res.status(201).json(await message.populate('sender', 'name avatarUrl'));
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const parsed = idParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const conversation = await Conversation.findById(parsed.data.id);
    if (!conversation) {
      res.status(404);
      return next(new Error('Conversation not found'));
    }
    if (!isParticipant(conversation, req.user._id)) {
      res.status(403);
      return next(new Error('Forbidden'));
    }
    const result = await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: req.user._id }, readAt: null },
      { readAt: new Date() }
    );
    res.json({ read: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};
