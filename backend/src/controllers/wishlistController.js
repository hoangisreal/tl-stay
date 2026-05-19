import User from '../models/User.js';
import Listing from '../models/Listing.js';
import { objectIdSchema } from '../utils/validators.js';

export const list = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favoriteListings',
      match: { isActive: true },
      populate: { path: 'host', select: 'name avatarUrl' },
    });
    res.json(user.favoriteListings);
  } catch (err) {
    next(err);
  }
};

export const toggle = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const parsed = objectIdSchema.safeParse(listingId);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const listing = await Listing.findOne({ _id: listingId, isActive: true });
    if (!listing) {
      res.status(404);
      return next(new Error('Listing not found'));
    }
    const user = await User.findById(req.user._id);
    const idx = user.favoriteListings.findIndex((id) => id.toString() === listingId);
    let favorited;
    if (idx >= 0) {
      user.favoriteListings.splice(idx, 1);
      favorited = false;
    } else {
      user.favoriteListings.push(listingId);
      favorited = true;
    }
    await user.save();
    res.json({ favorited, count: user.favoriteListings.length });
  } catch (err) {
    next(err);
  }
};
