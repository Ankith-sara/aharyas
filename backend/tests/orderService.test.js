import { jest } from '@jest/globals';
import crypto from 'crypto';

// ── verifyAndFinaliseRazorpayOrder (extracted logic) ─────────────────────────

function verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature, secret }) {
    const expected = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
    return expected === razorpay_signature;
}

describe('Razorpay signature verification', () => {
    const secret = 'test_secret_key';
    const orderId = 'order_abc123';
    const paymentId = 'pay_xyz789';

    const validSig = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    test('returns true for a valid signature', () => {
        expect(verifySignature({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: validSig,
            secret,
        })).toBe(true);
    });

    test('returns false for a tampered signature', () => {
        expect(verifySignature({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: 'tampered_signature',
            secret,
        })).toBe(false);
    });

    test('returns false when order ID changes', () => {
        expect(verifySignature({
            razorpay_order_id: 'order_different',
            razorpay_payment_id: paymentId,
            razorpay_signature: validSig,
            secret,
        })).toBe(false);
    });
});

// ── Order notification helper ─────────────────────────────────────────────────

describe('sendOrderNotifications', () => {
    async function sendOrderNotifications(order, user, emailFn) {
        try {
            await emailFn(order, user);
            return true;
        } catch {
            return false;
        }
    }

    test('returns true when email sends successfully', async () => {
        const result = await sendOrderNotifications({}, {}, jest.fn().mockResolvedValue());
        expect(result).toBe(true);
    });

    test('swallows email errors and returns false without throwing', async () => {
        const result = await sendOrderNotifications(
            {}, {},
            jest.fn().mockRejectedValue(new Error('SMTP failure'))
        );
        expect(result).toBe(false);
    });
});

// ── Status update email trigger logic ────────────────────────────────────────

describe('status email trigger', () => {
    function shouldSendShippingEmail(status, previousStatus) {
        return status === 'Shipping' && previousStatus !== 'Shipping';
    }
    function shouldSendDeliveredEmail(status, previousStatus) {
        return status === 'Delivered' && previousStatus !== 'Delivered';
    }

    test('triggers shipping email on first Shipping transition', () => {
        expect(shouldSendShippingEmail('Shipping', 'Order Placed')).toBe(true);
    });

    test('does not re-trigger shipping email if already Shipping', () => {
        expect(shouldSendShippingEmail('Shipping', 'Shipping')).toBe(false);
    });

    test('triggers delivered email on first Delivered transition', () => {
        expect(shouldSendDeliveredEmail('Delivered', 'Shipping')).toBe(true);
    });

    test('does not re-trigger delivered email if already Delivered', () => {
        expect(shouldSendDeliveredEmail('Delivered', 'Delivered')).toBe(false);
    });

    test('does not trigger delivered email on unrelated status change', () => {
        expect(shouldSendDeliveredEmail('Shipping', 'Order Placed')).toBe(false);
    });
});
