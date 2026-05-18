import { z } from 'zod';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import { getBookedRanges } from '../utils/availability.js';

const listingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  pricePerNight: z.coerce.number().positive(),
  maxGuests: z.coerce.number().int().min(1),
  bedrooms: z.coerce.number().int().min(1).optional(),
  beds: z.coerce.number().int().min(1).optional(),
  bathrooms: z.coerce.number().int().min(1).optional(),
  city: z.string().min(2),
  address: z.string().min(5),
  country: z.string().optional(),
  amenities: z.string().optional(),
});

export const create = async (req, res, next) => {
  try {
    const parsed = listingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { city, address, country, amenities, ...rest } = parsed.data;
    const images = req.files?.map((f) => `/uploads/listings/${f.filename}`) || [];
    const listing = await Listing.create({
      ...rest,
      host: req.user._id,
      location: { city, address, country: country || 'Việt Nam' },
      amenities: amenities ? JSON.parse(amenities) : [],
      images,
    });
    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const { location, minPrice, maxPrice, guests, checkIn, checkOut, page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const filter = { isActive: true };

    if (location) filter['location.city'] = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = Number(maxPrice);
    }
    if (guests) filter.maxGuests = { $gte: Number(guests) };
    if (checkIn && checkOut) {
      const bookedIds = await Booking.distinct('listing', {
        status: { $ne: 'cancelled' },
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) },
      });
      filter._id = { $nin: bookedIds };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('host', 'name avatarUrl')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Listing.countDocuments(filter),
    ]);

    res.json({ listings, page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('host', 'name avatarUrl');
    if (!listing) {
      res.status(404);
      return next(new Error('Listing not found'));
    }
    res.json(listing);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const parsed = listingSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { city, address, country, amenities, ...rest } = parsed.data;
    const updateData = { ...rest };
    if (city || address) {
      updateData.location = {
        ...req.listing.location.toObject(),
        ...(city && { city }),
        ...(address && { address }),
        ...(country && { country }),
      };
    }
    if (amenities !== undefined) updateData.amenities = JSON.parse(amenities);
    if (req.files?.length) {
      updateData.images = req.files.map((f) => `/uploads/listings/${f.filename}`);
    }
    const updated = await Listing.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    next(err);
  }
};

export const getByHost = async (req, res, next) => {
  try {
    const listings = await Listing.find({ host: req.user._id }).sort('-createdAt');
    res.json(listings);
  } catch (err) {
    next(err);
  }
};

export const getAvailability = async (req, res, next) => {
  try {
    const ranges = await getBookedRanges(req.params.id);
    res.json(ranges);
  } catch (err) {
    next(err);
  }
};
