
import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';

import {
  verifyWebhook,
  splitRevenue
} from '../src/payments.js';

describe('Payment Webhook Verification', () => {
  const secret = 'test-secret';
  const body = JSON.stringify({
    reference: 'payment-001',
    status: 'success',
    amountMinor: '500000',
    currency: 'NGN'
  });

  it('accepts a valid signature', () => {
    const signature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    expect(
      verifyWebhook(body, signature, secret)
    ).toBe(true);
  });

  it('rejects an invalid signature', () => {
    expect(
      verifyWebhook(body, 'invalid', secret)
    ).toBe(false);
  });

  it('rejects a modified payload', () => {
    const signature = createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    expect(
      verifyWebhook(body + 'modified', signature, secret)
    ).toBe(false);
  });
});

describe('Revenue Splitting', () => {
  it('splits revenue 80/20', () => {
    const result = splitRevenue(500000n, 80);

    expect(result.operatorAmount).toBe(400000n);
    expect(result.platformAmount).toBe(100000n);
  });

  it('preserves the full amount with rounding', () => {
    const result = splitRevenue(101n, 80);

    expect(
      result.operatorAmount + result.platformAmount
    ).toBe(101n);
  });

  it('rejects invalid percentages', () => {
    expect(() => splitRevenue(100n, 120))
      .toThrow('Invalid percentage');
  });
});
