"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  if (joined) {
    return (
      <div className="mt-3 border border-[#c9c2b5] bg-[#f5f1ea] px-3 py-2 text-xs text-[#2c2925]">
        Thank you for subscribing to Nova Threads Journal.
      </div>
    );
  }

  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) setJoined(true);
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        aria-label="Email address for newsletter"
        className="w-full min-w-0 border border-[#e5dfd5] bg-[#faf8f5] px-3 py-2 text-xs text-[#171614] placeholder:text-[#9c958a] focus:border-[#171614] focus:bg-white focus:outline-none transition"
      />
      <button
        type="submit"
        className="shrink-0 border border-[#171614] bg-[#171614] px-4 py-2 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#33302b] transition"
      >
        Subscribe
      </button>
    </form>
  );
}
