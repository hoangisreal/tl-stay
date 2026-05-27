import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeBreakdown } from '../utils/pricing.js';

describe('Pricing Utils', () => {
  it('should calculate basic breakdown', () => {
    const result = computeBreakdown('2024-01-01', '2024-01-03', 100, 20);
    assert.strictEqual(result.nights, 2);
    assert.strictEqual(result.subtotal, 200);
    assert.strictEqual(result.cleaningFee, 20);
    assert.ok(result.totalPrice > 200);
  });

  it('should apply monthly discount', () => {
    const listing = { pricePerNight: 100, monthlyDiscount: 10, customPricing: [] };
    const result = computeBreakdown('2024-01-01', '2024-02-01', 100, 0, listing);
    assert.ok(result.monthlyDiscount > 0);
  });
});
