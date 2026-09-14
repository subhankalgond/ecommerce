import { NextResponse } from "next/server";

const PLACEHOLDERS = new Set([
  "",
  "sk_test_your_key_here",
  "rzp_test_your_key_here",
]);

function isConfigured(envValue: string | undefined): boolean {
  return !!envValue && !PLACEHOLDERS.has(envValue.trim());
}

export function GET() {
  return NextResponse.json({
    stripe: isConfigured(process.env.STRIPE_SECRET_KEY),
    razorpay: isConfigured(process.env.RAZORPAY_KEY_ID),
    // Cash on Delivery is always offered in this demo store
    cod: true,
  });
}
