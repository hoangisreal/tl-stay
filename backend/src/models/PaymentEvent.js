import mongoose from 'mongoose';

const paymentEventSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'mock' },
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    paymentIntentId: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const PaymentEvent = mongoose.model('PaymentEvent', paymentEventSchema);

export default PaymentEvent;
