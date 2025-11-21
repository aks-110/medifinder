import crypto from "node:crypto";
import { v4 as uuid } from "uuid";

let razorpay = null;
const REAL_PAYMENTS = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

async function getRazorpay() {
  if (!REAL_PAYMENTS) return null;
  if (razorpay) return razorpay;
  const Razorpay = (await import("razorpay")).default;
  razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  return razorpay;
}

export const paymentsAreLive = () => REAL_PAYMENTS;

// amountRupees: number, e.g. 500 for ₹500
export async function createOrder(amountRupees, receipt) {
  const client = await getRazorpay();
  if (!client) {
    // Dev mode: no real gateway configured, simulate an order that auto-verifies.
    return { orderId: `mock_${uuid()}`, amount: amountRupees, currency: "INR", live: false, keyId: null };
  }
  const order = await client.orders.create({ amount: Math.round(amountRupees * 100), currency: "INR", receipt });
  return { orderId: order.id, amount: amountRupees, currency: "INR", live: true, keyId: process.env.RAZORPAY_KEY_ID };
}

// Verifies a real Razorpay payment signature, or auto-passes for mock orders.
export function verifyPayment({ orderId, paymentId, signature }) {
  if (orderId.startsWith("mock_")) return true;
  if (!REAL_PAYMENTS) return false;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
