import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['booking_created', 'booking_paid', 'booking_cancelled', 'booking_refunded', 'booking_failed'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    readAt: { type: Date },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
