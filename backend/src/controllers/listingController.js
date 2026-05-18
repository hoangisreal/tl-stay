import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import BookingHold from '../models/BookingHold.js';
import Review from '../models/Review.js';
import { getBookedRanges } from '../utils/availability.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '../../uploads');

const removeImageFiles = async (images = []) => {
  await Promise.all(
    images
      .filter((img) => typeof img === 'string' && img.startsWith('/uploads/'))
      .map(async (img) => {
        const abs = path.join(uploadsRoot, img.replace(/^\/uploads\//, ''));
        try {
          await fs.unlink(abs);
        } catch {}
      })
  );
};

const uploadedImagePaths = (files = []) => files.map((f) => `/uploads/listings/${f.filename}`);

const parseAmenities = (value) => {
  if (!value) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
    throw new Error('Amenities must be a JSON array of strings');
  }
  return parsed;
};

const CATEGORIES = ['beach', 'mountain', 'city', 'cabin', 'countryside', 'lakeside', 'tropical', 'pool', 'design'];

const listingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  pricePerNight: z.coerce.number().positive(),
  cleaningFee: z.coerce.number().min(0).optional(),
  maxGuests: z.coerce.number().int().min(1),
  bedrooms: z.coerce.number().int().min(1).optional(),
  beds: z.coerce.number().int().min(1).optional(),
  bathrooms: z.coerce.number().int().min(1).optional(),
  city: z.string().min(2),
  address: z.string().min(5),
  country: z.string().optional(),
  amenities: z.string().optional(),
  category: z.enum(CATEGORIES).optional(),
});

export const create = async (req, res, next) => {
  const images = uploadedImagePaths(req.files);
  try {
    const parsed = listingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      await removeImageFiles(images);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { city, address, country, amenities, ...rest } = parsed.data;
    let amenitiesList;
    try {
      amenitiesList = parseAmenities(amenities);
    } catch (err) {
      res.status(400);
      throw err;
    }
    const listing = await Listing.create({
      ...rest,
      host: req.user._id,
      location: { city, address, country: country || 'Việt Nam' },
      amenities: amenitiesList,
      images,
    });
    res.status(201).json(listing);
  } catch (err) {
    await removeImageFiles(images);
    next(err);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const { location, minPrice, maxPrice, guests, category, checkIn, checkOut, page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const filter = { isActive: true };

    if (location) filter['location.city'] = { $regex: location, $options: 'i' };
    if (category && CATEGORIES.includes(category)) filter.category = category;
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
    const listing = await Listing.findOne({ _id: req.params.id, isActive: true }).populate('host', 'name avatarUrl');
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
  const newImages = uploadedImagePaths(req.files);
  try {
    const parsed = listingSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      await removeImageFiles(newImages);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { city, address, country, amenities, ...rest } = parsed.data;
    const updateData = { ...rest };
    if (city || address || country) {
      updateData.location = {
        ...req.listing.location.toObject(),
        ...(city && { city }),
        ...(address && { address }),
        ...(country && { country }),
      };
    }
    if (amenities !== undefined) {
      try {
        updateData.amenities = parseAmenities(amenities);
      } catch (err) {
        res.status(400);
        throw err;
      }
    }
    const replace = req.body.replaceImages === 'true';
    if (newImages.length) {
      if (replace) {
        updateData.images = newImages;
      } else {
        updateData.images = [...req.listing.images, ...newImages];
      }
    }
    const updated = await Listing.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (newImages.length && replace) await removeImageFiles(req.listing.images);
    res.json(updated);
  } catch (err) {
    await removeImageFiles(newImages);
    next(err);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const [bookingCount, reviewCount] = await Promise.all([
      Booking.countDocuments({ listing: req.params.id }),
      Review.countDocuments({ listing: req.params.id }),
    ]);

    if (bookingCount > 0 || reviewCount > 0) {
      req.listing.isActive = false;
      await req.listing.save();
      return res.json({ message: 'Listing deactivated' });
    }

    await Promise.all([
      removeImageFiles(req.listing.images),
      BookingHold.deleteMany({ listing: req.params.id }),
      Listing.findByIdAndDelete(req.params.id),
    ]);
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    next(err);
  }
};

export const getByHost = async (req, res, next) => {
  try {
    const listings = await Listing.find({ host: req.user._id, isActive: true }).sort('-createdAt');
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
