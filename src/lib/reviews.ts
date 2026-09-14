import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");

export interface Review {
  id: string;
  productId: string;
  /** optional when a customer checks out as guest */
  email?: string;
  author: string;
  rating: number;
  title?: string;
  body: string;
  photo?: string;
  createdAt: string;
  /** admin moderation */
  approved: boolean;
}

function loadReviews(): Review[] {
  try {
    const raw = fs.readFileSync(REVIEWS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Review[]) : [];
  } catch {
    return [];
  }
}

function saveReviews(reviews: Review[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf8");
}

export function addReview(input: Omit<Review, "id" | "createdAt" | "approved">): Review {
  const reviews = loadReviews();
  const review: Review = {
    ...input,
    id: `r${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    createdAt: new Date().toISOString(),
    approved: true,
  };
  reviews.push(review);
  saveReviews(reviews);
  return review;
}

export function listReviews(productId: string): Review[] {
  return loadReviews()
    .filter((r) => r.productId === productId && r.approved)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllReviews(): Review[] {
  return loadReviews().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function deleteReview(id: string): void {
  saveReviews(loadReviews().filter((r) => r.id !== id));
}

export function reviewSummary(productId: string): {
  count: number;
  average: number;
} {
  const reviews = listReviews(productId);
  if (reviews.length === 0) return { count: 0, average: 0 };
  const average = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { count: reviews.length, average: Math.round(average * 10) / 10 };
}

/** Rating summaries for many products at once (used by cards/catalog) */
export function ratingMap(productIds: string[]): Record<string, { count: number; average: number }> {
  const out: Record<string, { count: number; average: number }> = {};
  const reviews = loadReviews().filter((r) => r.approved);
  for (const id of productIds) {
    const mine = reviews.filter((r) => r.productId === id);
    out[id] =
      mine.length === 0
        ? { count: 0, average: 0 }
        : {
            count: mine.length,
            average: Math.round((mine.reduce((s, r) => s + r.rating, 0) / mine.length) * 10) / 10,
          };
  }
  return out;
}
