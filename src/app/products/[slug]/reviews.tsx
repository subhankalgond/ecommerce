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
    <span className="text-amber-500" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(Math.round(value))}
      <span className="text-neutral-300">{"★".repeat(5 - Math.round(value))}</span>
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
      setError("Please add your name and a few words about the product.");
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
      .catch(() => setError("Network error — try again."))
      .finally(() => setLoading(false));
  };

  const count = summary.count + (done ? 1 : 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Customer reviews</h2>
          {count > 0 ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
              <Stars value={summary.average} />
              <span>
                {summary.average} out of 5 · {count} review{count === 1 ? "" : "s"}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-neutral-500">
              No reviews yet — be the first to share your experience.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-full border border-neutral-900 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
        >
          {open ? "Close" : "Write a review"}
        </button>
      </div>

      {open && (
        <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Your rating:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                className={`text-xl transition ${n <= rating ? "text-amber-500" : "text-neutral-300 hover:text-amber-400"}`}
              >
                ★
              </button>
            ))}
          </div>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name"
            className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review headline (optional)"
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you like or dislike?"
            rows={3}
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
          <input
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="Photo URL (optional)"
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="mt-3 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit review"}
          </button>
        </div>
      )}

      <ul className="mt-8 space-y-6">
        {reviews.map((r) => (
          <li key={r.id} className="border-b border-neutral-100 pb-6 last:border-0">
            <div className="flex items-center gap-3">
              <Stars value={r.rating} />
              <p className="text-sm font-semibold">{r.title || "Verified purchase"}</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{r.body}</p>
            {r.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.photo} alt="Customer photo" className="mt-3 h-24 w-24 rounded-lg object-cover" />
            )}
            <p className="mt-2 text-xs text-neutral-400">
              {r.author} · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
