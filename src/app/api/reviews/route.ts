import { NextResponse } from "next/server";
import { listReviews, addReview, reviewSummary } from "@/lib/reviews";

/** GET /api/reviews?productId=… — list reviews + summary */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId") ?? "";
  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }
  const reviews = listReviews(productId);
  const summary = reviewSummary(productId);
  return NextResponse.json({ reviews, summary });
}

/** POST /api/reviews — submit a review (auto-approved in this demo) */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId : "";
  const author = typeof body.author === "string" ? body.author.trim().slice(0, 60) : "";
  const bodyText = typeof body.body === "string" ? body.body.trim().slice(0, 1000) : "";
  const rating = typeof body.rating === "number" ? Math.round(body.rating) : 0;
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const photo = typeof body.photo === "string" && /^https?:\/\//.test(body.photo) ? body.photo : undefined;

  if (!productId || !author || !bodyText || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Name, a 1-5 rating and a short review are required." },
      { status: 400 }
    );
  }

  const review = addReview({
    productId,
    author,
    body: bodyText,
    rating,
    title: title || undefined,
    email: email || undefined,
    photo,
  });
  return NextResponse.json({ ok: true, review });
}
