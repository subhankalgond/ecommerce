"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const RECENT_KEY = "nova-threads-recent-searches";
const POPULAR = ["linen shirt", "denim jacket", "oxford", "t-shirts", "knitwear", "dresses"];

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

function formatPrice(paise: number): string {
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

  // Debounce query navigation
  useEffect(() => {
    const t = setTimeout(() => {
      const q = value.trim();
      if (q.length >= 2) {
        router.push(`/products?q=${encodeURIComponent(q)}`);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [value, router]);

  // Fetch suggestions
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { suggestions?: Suggestion[] }) => setSuggestions(d.suggestions ?? []))
        .catch(() => setSuggestions([]));
    }, 180);
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
    <div ref={boxRef} className="relative w-full">
      <div className="relative flex items-center">
        <svg
          className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#8c857b]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
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
          placeholder="Search garments, essentials…"
          aria-label="Search garments"
          className="w-full sm:w-48 lg:w-60 border border-[#e5dfd5] bg-[#f7f4ee] py-1.5 pl-8 pr-7 text-xs text-[#171614] placeholder:text-[#9e978e] focus:border-[#171614] focus:bg-white focus:outline-none transition"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setSuggestions([]);
            }}
            className="absolute right-2 text-[#8c857b] hover:text-[#171614] p-0.5"
            aria-label="Clear search"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-full z-50 mt-1.5 w-80 max-w-[90vw] border border-[#e5dfd5] bg-[#faf8f5] shadow-xl">
          {suggestions.length > 0 ? (
            <ul className="max-h-80 divide-y divide-[#ede6da] overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/products/${s.slug}`}
                    onClick={() => {
                      saveRecent(value.trim());
                      setFocused(false);
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-[#f2ece2] transition"
                  >
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden bg-[#ede6da]">
                      <Image
                        src={s.image}
                        alt={s.name}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-xs text-[#171614]">{s.name}</span>
                      <span className="block text-[10px] uppercase tracking-wider text-[#8c857b]">{s.category}</span>
                    </span>
                    <span className="text-xs font-semibold text-[#171614]">{formatPrice(s.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-4 p-4 text-xs">
              {recent.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8c857b] mb-2">
                    Recent Searches
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
                        className="border border-[#ded8cc] bg-white px-2.5 py-1 text-[11px] text-[#3a3733] hover:border-[#171614] transition"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8c857b] mb-2">
                  Editorial Curations
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
                      className="border border-[#ded8cc] bg-[#f5f0e8] px-2.5 py-1 text-[11px] text-[#4d4841] hover:border-[#171614] hover:bg-white transition"
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
