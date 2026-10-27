"use client";

import { useState } from "react";
import type { Review } from "@/lib/reviews";

interface Props {
  productId: string;
  initialReviews: Review[];
  summary: { count: number; average: number };
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-[#8b5a42] tracking-widest text-xs" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(Math.round(value))}
      <span className="text-[#d5cebf]">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export default function ProductReviews({ productId, initialReviews, summary }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setError(null);
    if (!author.trim() || !body.trim()) {
      setError("Please provide your name and your review notes.");
      return;
    }
    setLoading(true);
    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, author, title, body, photo }),
    })
      .then((r) => r.json())
      .then((d: { ok?: boolean; review?: Review; error?: string }) => {
        if (d.ok && d.review) {
          setReviews((prev) => [d.review!, ...prev]);
          setDone(true);
          setOpen(false);
        } else {
          setError(d.error ?? "Could not submit review.");
        }
      })
      .catch(() => setError("Network error — please try again."))
      .finally(() => setLoading(false));
  };

  const count = summary.count + (done ? 1 : 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e5dfd5] pb-5 gap-4">
        <div>
          <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
            Feedback &amp; Wear Notes
          </span>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#171614]">
            Customer Reviews
          </h2>
          {count > 0 ? (
            <p className="mt-1 flex items-center gap-2 text-xs text-[#615a51]">
              <Stars value={summary.average} />
              <span>
                {summary.average} out of 5 · {count} verified {count === 1 ? "review" : "reviews"}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#736c62]">
              No customer reviews recorded yet for this piece.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="border border-[#171614] bg-white px-5 py-2 text-xs font-semibold tracking-wider uppercase text-[#171614] hover:bg-[#171614] hover:text-white transition"
        >
          {open ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {open && (
        <div className="mt-6 border border-[#ded7ca] bg-[#fbf9f5] p-6 text-xs">
          <p className="font-serif text-base text-[#171614]">Submit Your Review</p>
          
          <div className="mt-4 flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[#8c857b]">Rating:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                className={`text-lg transition ${n <= rating ? "text-[#8b5a42]" : "text-[#ded7ca] hover:text-[#8b5a42]"}`}
              >
                ★
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your Name (e.g. Eleanor W.)"
              className="w-full border border-[#ded7ca] bg-white px-3 py-2 text-xs text-[#171614] focus:border-[#171614] focus:outline-none"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Review Headline (optional)"
              className="w-full border border-[#ded7ca] bg-white px-3 py-2 text-xs text-[#171614] focus:border-[#171614] focus:outline-none"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe the fit, drape, texture, and longevity..."
              rows={4}
              className="w-full border border-[#ded7ca] bg-white px-3 py-2 text-xs text-[#171614] focus:border-[#171614] focus:outline-none"
            />
            <input
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="Photo URL (optional)"
              className="w-full border border-[#ded7ca] bg-white px-3 py-2 text-xs text-[#171614] focus:border-[#171614] focus:outline-none"
            />
          </div>

          {error && <p className="mt-2 text-xs text-[#8b5a42] font-medium">{error}</p>}

          <div className="mt-4">
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="border border-[#171614] bg-[#171614] px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition disabled:opacity-40"
            >
              {loading ? "Publishing…" : "Publish Review"}
            </button>
          </div>
        </div>
      )}

      {/* Review List */}
      <ul className="mt-8 divide-y divide-[#ede6da]">
        {reviews.map((r) => (
          <li key={r.id} className="py-6 first:pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stars value={r.rating} />
                <span className="font-serif text-sm font-medium text-[#171614]">
                  {r.title || "Verified Experience"}
                </span>
              </div>
              <span className="text-[11px] text-[#8c857b]">
                {new Date(r.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-[#544e45]">
              {r.body}
            </p>

            {r.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.photo}
                alt="Customer submission"
                className="mt-3 h-28 w-24 object-cover border border-[#e5dfd5]"
              />
            )}

            <p className="mt-2 text-[10px] uppercase tracking-wider text-[#8c857b]">
              Reviewed by {r.author} · <span className="text-[#515c4d]">Verified Customer</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
