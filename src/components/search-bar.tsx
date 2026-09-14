"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const RECENT_KEY = "nova-threads-recent-searches";
const POPULAR = ["tshirts", "jeans", "dresses", "jackets", "kids", "saree"];

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

function price(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function SearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounce navigation so we don't push a history entry per keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      const q = value.trim();
      if (q.length >= 2) {
        router.push(`/products?q=${encodeURIComponent(q)}`);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [value, router]);

  // Fetch suggestions (debounced, lighter than navigation)
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { suggestions?: Suggestion[] }) =>
          setSuggestions(d.suggestions ?? [])
        )
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
      if (Array.isArray(stored)) setRecent(stored as string[]);
    } catch {
      // ignore
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const saveRecent = (q: string) => {
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 5);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const showPanel = focused && (suggestions.length > 0 || recent.length > 0 || value.trim().length < 2);

  return (
    <div ref={boxRef} className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            saveRecent(value.trim());
            setFocused(false);
          }
        }}
        placeholder="Search tshirts, jeans, sarees…"
        aria-label="Search products"
        title="Search clothing — misspellings are OK"
        className="w-44 rounded-full border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-3 text-sm placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none lg:w-52"
      />

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 w-80 max-w-[85vw] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          {suggestions.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/products/${s.slug}`}
                    onClick={() => {
                      saveRecent(value.trim());
                      setFocused(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${s.image}&w=96`} alt="" className="h-10 w-8 rounded object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{s.name}</span>
                      <span className="block text-xs capitalize text-neutral-400">{s.category}</span>
                    </span>
                    <span className="text-sm font-semibold">{price(s.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3 p-3">
              {recent.length > 0 && (
                <div>
                  <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    Recent searches
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setValue(r);
                          router.push(`/products?q=${encodeURIComponent(r)}`);
                          setFocused(false);
                        }}
                        className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-200"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                  Popular searches
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setValue(p);
                        router.push(`/products?q=${encodeURIComponent(p)}`);
                        setFocused(false);
                      }}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-xs capitalize text-neutral-600 hover:border-neutral-400"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
