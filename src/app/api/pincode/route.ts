import { NextResponse } from "next/server";
import { checkPincode } from "@/lib/pincode";

/** Delivery/pincode serviceability check for the product page. */
export async function POST(request: Request) {
  let body: { pincode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const pincode = typeof body.pincode === "string" ? body.pincode : "";
  const result = checkPincode(pincode);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
