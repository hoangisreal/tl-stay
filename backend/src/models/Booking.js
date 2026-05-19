import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    nights: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    cleaningFee: { type: Number, default: 0, min: 0 },
    serviceFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'failed', 'cancelled', 'pending', 'confirmed'],
      default: 'unpaid',
      index: true,
    },
    payment: {
      provider: { type: String, default: 'mock' },
      intentId: { type: String, index: true },
      status: {
        type: String,
        enum: ['requires_payment', 'paid', 'refunded', 'failed', 'cancelled'],
        default: 'requires_payment',
      },
      amount: { type: Number, min: 0 },
      currency: { type: String, default: 'VND' },
      checkoutUrl: { type: String, default: '' },
      dueAt: { type: Date },
      paidAt: { type: Date },
      failedAt: { type: Date },
      refundedAt: { type: Date },
      refundAmount: { type: Number, min: 0, default: 0 },
    },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({ listing: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ guest: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
