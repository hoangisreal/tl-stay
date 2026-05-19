import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    pricePerNight: { type: Number, required: true, min: 0 },
    maxGuests: { type: Number, required: true, min: 1 },
    bedrooms: { type: Number, default: 1 },
    beds: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    location: {
      country: { type: String, default: 'Việt Nam' },
      city: { type: String, required: true },
      address: { type: String, required: true },
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    amenities: [{ type: String }],
    images: [{ type: String }],
    category: {
      type: String,
      enum: ['beach', 'mountain', 'city', 'cabin', 'countryside', 'lakeside', 'tropical', 'pool', 'design'],
      default: 'city',
      index: true,
    },
    cleaningFee: { type: Number, default: 0, min: 0 },
    blockedDates: [{ type: Date }],
    minNights: { type: Number, default: 1, min: 1 },
    maxNights: { type: Number, min: 1 },
    advanceNoticeDays: { type: Number, default: 0, min: 0 },
    maxAdvanceBookingDays: { type: Number, default: 365, min: 1 },
    checkInDays: [{ type: Number, min: 0, max: 6 }],
    checkOutDays: [{ type: Number, min: 0, max: 6 }],
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

listingSchema.index({ 'location.city': 1 });
listingSchema.index({ pricePerNight: 1 });
listingSchema.index({ maxGuests: 1 });
listingSchema.index({ avgRating: -1 });
listingSchema.index({ blockedDates: 1 });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
