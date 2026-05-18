import mongoose from 'mongoose';

const bookingHoldSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

bookingHoldSchema.index({ listing: 1, date: 1 }, { unique: true });
bookingHoldSchema.index({ booking: 1 });

const BookingHold = mongoose.model('BookingHold', bookingHoldSchema);

export default BookingHold;
