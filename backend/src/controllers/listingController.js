import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import BookingHold from '../models/BookingHold.js';
import Review from '../models/Review.js';
import {
  ACTIVE_BOOKING_STATUSES,
  getAvailabilityRules,
  getBookedRanges,
  getListingsWithBlockedDates,
  normalizeBlockedDates,
} from '../utils/availability.js';
import { dateOnlySchema, objectIdSchema, parseDateOnly } from '../utils/validators.js';
import { logActivity } from '../utils/activityLogger.js';

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
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw Object.assign(new Error('Amenities must be valid JSON'), { statusCode: 400 });
  }
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
    throw Object.assign(new Error('Amenities must be a JSON array of strings'), { statusCode: 400 });
  }
  return parsed;
};

const parseJsonArray = (value, label) => {
  if (!value) return [];
  let parsed;
  try {
    parsed = typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    throw Object.assign(new Error(`${label} must be valid JSON`), { statusCode: 400 });
  }
  if (!Array.isArray(parsed)) {
    throw Object.assign(new Error(`${label} must be a JSON array`), { statusCode: 400 });
  }
  return parsed;
};

const parseBlockedDates = (value) => {
  const dates = parseJsonArray(value, 'Blocked dates');
  for (const item of dates) {
    if (!dateOnlySchema.safeParse(item).success || !parseDateOnly(item)) {
      throw Object.assign(new Error('Blocked dates must use YYYY-MM-DD format'), { statusCode: 400 });
    }
  }
  return normalizeBlockedDates(dates.map(parseDateOnly));
};

const parseDayList = (value, label) => {
  const days = parseJsonArray(value, label);
  if (days.some((day) => !Number.isInteger(Number(day)) || Number(day) < 0 || Number(day) > 6)) {
    throw Object.assign(new Error(`${label} must contain day numbers from 0 to 6`), { statusCode: 400 });
  }
  return Array.from(new Set(days.map(Number))).sort((a, b) => a - b);
};

const CATEGORIES = ['beach', 'mountain', 'city', 'cabin', 'countryside', 'lakeside', 'tropical', 'pool', 'design'];
const SORT_OPTIONS = ['-createdAt', 'createdAt', 'pricePerNight', '-pricePerNight', 'avgRating', '-avgRating'];

const listingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  pricePerNight: z.coerce.number().positive(),
  cleaningFee: z.coerce.number().min(0).optional(),
  minNights: z.coerce.number().int().min(1).optional(),
  maxNights: z.coerce.number().int().min(1).optional(),
  advanceNoticeDays: z.coerce.number().int().min(0).optional(),
  maxAdvanceBookingDays: z.coerce.number().int().min(1).optional(),
  blockedDates: z.string().optional(),
  checkInDays: z.string().optional(),
  checkOutDays: z.string().optional(),
  maxGuests: z.coerce.number().int().min(1),
  bedrooms: z.coerce.number().int().min(1).optional(),
  beds: z.coerce.number().int().min(1).optional(),
  bathrooms: z.coerce.number().int().min(1).optional(),
  city: z.string().min(2),
  address: z.string().min(5),
  country: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  amenities: z.string().optional(),
  category: z.enum(CATEGORIES).optional(),
});

const listingQuerySchema = z
  .object({
    location: z.string().trim().min(1).max(80).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    guests: z.coerce.number().int().min(1).optional(),
    category: z.enum(CATEGORIES).optional(),
    checkIn: dateOnlySchema.optional(),
    checkOut: dateOnlySchema.optional(),
    amenities: z.string().optional(),
    bedrooms: z.coerce.number().int().min(1).optional(),
    beds: z.coerce.number().int().min(1).optional(),
    bathrooms: z.coerce.number().int().min(1).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    sort: z.enum(SORT_OPTIONS).default('-createdAt'),
  })
  .superRefine((data, ctx) => {
    if ((data.checkIn && !data.checkOut) || (!data.checkIn && data.checkOut)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'checkIn and checkOut must be provided together' });
    }
    if (data.checkIn && data.checkOut) {
      const checkInDate = parseDateOnly(data.checkIn);
      const checkOutDate = parseDateOnly(data.checkOut);
      if (!checkInDate || !checkOutDate || checkInDate >= checkOutDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid date range' });
      }
    }
    if (data.minPrice !== undefined && data.maxPrice !== undefined && data.minPrice > data.maxPrice) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'minPrice cannot exceed maxPrice' });
    }
  });

const paramsSchema = z.object({
  id: objectIdSchema,
});

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const create = async (req, res, next) => {
  const images = uploadedImagePaths(req.files);
  try {
    const parsed = listingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      await removeImageFiles(images);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { city, address, country, lat, lng, amenities, blockedDates, checkInDays, checkOutDays, ...rest } = parsed.data;
    let amenitiesList;
    let availabilityData;
    try {
      amenitiesList = parseAmenities(amenities);
      availabilityData = {
        blockedDates: blockedDates ? parseBlockedDates(blockedDates) : [],
        checkInDays: checkInDays ? parseDayList(checkInDays, 'Check-in days') : [],
        checkOutDays: checkOutDays ? parseDayList(checkOutDays, 'Check-out days') : [],
      };
    } catch (err) {
      res.status(err.statusCode || 400);
      await removeImageFiles(images);
      return next(err);
    }
    const listing = await Listing.create({
      ...rest,
      host: req.user._id,
      location: { city, address, country: country || 'Việt Nam', lat, lng },
      amenities: amenitiesList,
      ...availabilityData,
      images,
    });
    await logActivity(req.user._id, 'listing.created', 'listing', listing._id, { title: listing.title }, req);
    res.status(201).json(listing);
  } catch (err) {
    await removeImageFiles(images);
    next(err);
  }
};

export const getAll = async (req, res, next) => {
  try {
    const parsed = listingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const { location, minPrice, maxPrice, guests, category, checkIn, checkOut, amenities, bedrooms, beds, bathrooms, page, limit, sort } = parsed.data;
    const filter = { isActive: true };

    if (location) filter['location.city'] = { $regex: escapeRegExp(location), $options: 'i' };
    if (category) filter.category = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.pricePerNight = {};
      if (minPrice !== undefined) filter.pricePerNight.$gte = minPrice;
      if (maxPrice !== undefined) filter.pricePerNight.$lte = maxPrice;
    }
    if (guests) filter.maxGuests = { $gte: guests };
    if (amenities) {
      const amenitiesList = amenities.split(',').map(a => a.trim()).filter(Boolean);
      if (amenitiesList.length > 0) filter.amenities = { $all: amenitiesList };
    }
    if (bedrooms) filter.bedrooms = { $gte: bedrooms };
    if (beds) filter.beds = { $gte: beds };
    if (bathrooms) filter.bathrooms = { $gte: bathrooms };

    if (checkIn && checkOut) {
      const [bookedIds, blockedIds] = await Promise.all([
        Booking.distinct('listing', {
          status: { $in: ACTIVE_BOOKING_STATUSES },
          checkIn: { $lt: parseDateOnly(checkOut) },
          checkOut: { $gt: parseDateOnly(checkIn) },
        }),
        getListingsWithBlockedDates(parseDateOnly(checkIn), parseDateOnly(checkOut)),
      ]);
      filter._id = { $nin: [...bookedIds, ...blockedIds] };
    }

    if (checkIn && checkOut) {
      const unavailableByRules = await Listing.distinct('_id', {
        isActive: true,
        $or: [
          { minNights: { $gt: Math.round((parseDateOnly(checkOut) - parseDateOnly(checkIn)) / 86400000) } },
          { maxNights: { $exists: true, $ne: null, $lt: Math.round((parseDateOnly(checkOut) - parseDateOnly(checkIn)) / 86400000) } },
        ],
      });
      filter._id = {
        $nin: [...(filter._id?.$nin || []), ...unavailableByRules],
      };
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('host', 'name avatarUrl')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Listing.countDocuments(filter),
    ]);

    res.json({ listings, page, limit, total, pages: Math.ceil(total / limit) });
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
    const listing = await Listing.findOne({ _id: parsed.data.id, isActive: true }).populate('host', 'name avatarUrl');
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
    const { city, address, country, lat, lng, amenities, blockedDates, checkInDays, checkOutDays, ...rest } = parsed.data;
    const updateData = { ...rest };
    if (city || address || country || lat !== undefined || lng !== undefined) {
      updateData.location = {
        ...req.listing.location.toObject(),
        ...(city && { city }),
        ...(address && { address }),
        ...(country && { country }),
        ...(lat !== undefined && { lat }),
        ...(lng !== undefined && { lng }),
      };
    }
    if (amenities !== undefined) {
      try {
        updateData.amenities = parseAmenities(amenities);
      } catch (err) {
        res.status(err.statusCode || 400);
        await removeImageFiles(newImages);
        return next(err);
      }
    }
    try {
      if (blockedDates !== undefined) updateData.blockedDates = parseBlockedDates(blockedDates);
      if (checkInDays !== undefined) updateData.checkInDays = parseDayList(checkInDays, 'Check-in days');
      if (checkOutDays !== undefined) updateData.checkOutDays = parseDayList(checkOutDays, 'Check-out days');
    } catch (err) {
      res.status(err.statusCode || 400);
      await removeImageFiles(newImages);
      return next(err);
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
    await logActivity(req.user._id, 'listing.updated', 'listing', updated._id, { fields: Object.keys(updateData) }, req);
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
      await logActivity(req.user._id, 'listing.deactivated', 'listing', req.listing._id, { bookingCount, reviewCount }, req);
      return res.json({ message: 'Listing deactivated' });
    }

    await Promise.all([
      removeImageFiles(req.listing.images),
      BookingHold.deleteMany({ listing: req.params.id }),
      Listing.findByIdAndDelete(req.params.id),
    ]);
    await logActivity(req.user._id, 'listing.deleted', 'listing', req.listing._id, { title: req.listing.title }, req);
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
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.errors[0].message));
    }
    const listing = await Listing.findOne({ _id: parsed.data.id, isActive: true }).select('_id');
    if (!listing) {
      res.status(404);
      return next(new Error('Listing not found'));
    }
    const ranges = await getBookedRanges(parsed.data.id);
    const fullListing = await Listing.findById(parsed.data.id).select(
      'blockedDates minNights maxNights advanceNoticeDays maxAdvanceBookingDays checkInDays checkOutDays'
    );
    res.json({
      bookedRanges: ranges,
      blockedDates: (fullListing.blockedDates || []).map((date) => date.toISOString().slice(0, 10)),
      rules: getAvailabilityRules(fullListing),
    });
  } catch (err) {
    next(err);
  }
};
