import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateRefund } from '../utils/cancellation.js';

describe('Cancellation Policy', () => {
  it('should give 100% refund for flexible policy 1+ days before', () => {
    const checkIn = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const booking = { checkIn, totalPrice: 1000 };
    const listing = { cancellationPolicy: 'flexible' };
    const result = calculateRefund(booking, listing);
    assert.strictEqual(result.refundAmount, 1000);
  });

  it('should give 50% refund for moderate policy 1-4 days before', () => {
    const checkIn = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const booking = { checkIn, totalPrice: 1000 };
    const listing = { cancellationPolicy: 'moderate' };
    const result = calculateRefund(booking, listing);
    assert.strictEqual(result.refundAmount, 500);
  });

  it('should give 0% refund for strict policy <3 days before', () => {
    const checkIn = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    const booking = { checkIn, totalPrice: 1000 };
    const listing = { cancellationPolicy: 'strict' };
    const result = calculateRefund(booking, listing);
    assert.strictEqual(result.refundAmount, 0);
  });
});
