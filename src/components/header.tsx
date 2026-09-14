"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { CATEGORIES } from "@/lib/products";
import { useCart } from "@/components/cart-provider";
import { useCustomer } from "@/components/customer-auth-provider";
import SearchBar from "@/components/search-bar";

export default function Header() {
  const { count, hydrated, openCart } = useCart();
  const { user, logout } = useCustomer();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: mobile menu + logo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 7h16M4 12h16M4 17h16"}
                />
              </svg>
            </button>
            <Link href="/" className="text-lg font-bold tracking-tight">
              Nova&nbsp;Threads
            </Link>
          </div>

          {/* Center: desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={cat.value === "all" ? "/products" : `/products?category=${cat.value}`}
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                {cat.label}
              </Link>
            ))}
            <Link
              href="/products?sale=1"
              className="rounded-full px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              Sale
            </Link>
            <Link
              href="/track"
              className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              Track order
            </Link>
            <Link
              href="/wishlist"
              className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              Wishlist
            </Link>
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name.split(" ")[0]}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
                    <div className="border-b border-neutral-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-neutral-500">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      🧾 My orders
                    </Link>
                    <Link
                      href="/account?tab=addresses"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      📍 Saved addresses
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        void logout();
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0" />
                </svg>
                Login
              </Link>
            )}
          </nav>

          {/* Right: search + cart */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <SearchBar />
            </div>
            <Link
              href="/admin"
              className="relative rounded-md p-2 text-neutral-700 transition hover:bg-neutral-100"
              aria-label="Admin Panel"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.054-2.066.05A5.38 5.38 0 014.5 10.5v-3.5a5.38 5.38 0 013.774-5.39 36.19 36.19 0 017.452 0A5.38 5.38 0 0119.5 7v3.5a5.38 5.38 0 01-3.774 5.39 36.32 36.32 0 01-2.066-.05m-3.32 0v5.61m0 0a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative rounded-md p-2 text-neutral-700 transition hover:bg-neutral-100"
              aria-label={`Open cart${hydrated && count > 0 ? ` (${count} items)` : ""}`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
                />
              </svg>
              {hydrated && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-900 px-1 text-[11px] font-semibold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={cat.value === "all" ? "/products" : `/products?category=${cat.value}`}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {cat.label}
              </Link>
            ))}
            <Link
              href="/products?sale=1"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              Sale
            </Link>
            <Link
              href="/track"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Track order
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Wishlist
            </Link>
            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  My account ({user.name.split(" ")[0]})
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    void logout();
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
              >
                Login / Sign up
              </Link>
            )}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Admin Panel
            </Link>
            <Link
              href="/support"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Support
            </Link>
            <div className="px-3 pt-2 md:hidden">
              <SearchBar />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
