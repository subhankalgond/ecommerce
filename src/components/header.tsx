"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { useCustomer } from "@/components/customer-auth-provider";
import SearchBar from "@/components/search-bar";

export default function Header() {
  const { count: cartCount, hydrated: cartHydrated, openCart } = useCart();
  const { count: wishlistCount, hydrated: wishlistHydrated } = useWishlist();
  const { user, logout } = useCustomer();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Announcement Strip */}
      <div className="border-b border-[#e5dfd5] bg-[#f5f0e8] px-4 py-2 text-center text-[11px] font-medium tracking-[0.16em] uppercase text-[#615a51]">
        <span>Complimentary delivery on orders over ₹999</span>
        <span className="mx-2 text-[#b0a99f]">·</span>
        <span className="text-[#171614]">10% off with code <strong className="font-semibold tracking-wider">WELCOME10</strong></span>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#e5dfd5] bg-[#faf8f5]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between gap-4">
            
            {/* Left: Mobile hamburger & primary categories */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="p-1.5 text-[#171614] transition hover:text-[#8b5a42] lg:hidden"
                aria-label="Open navigation menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>

              <nav className="hidden items-center gap-7 lg:flex" aria-label="Storefront Categories">
                <Link
                  href="/products?category=women"
                  className="text-xs font-medium tracking-[0.12em] uppercase text-[#3a3733] transition hover:text-[#171614]"
                >
                  Women
                </Link>
                <Link
                  href="/products?category=men"
                  className="text-xs font-medium tracking-[0.12em] uppercase text-[#3a3733] transition hover:text-[#171614]"
                >
                  Men
                </Link>
                <Link
                  href="/products?category=kids"
                  className="text-xs font-medium tracking-[0.12em] uppercase text-[#3a3733] transition hover:text-[#171614]"
                >
                  Kids
                </Link>
                <Link
                  href="/products?sort=newest"
                  className="text-xs font-medium tracking-[0.12em] uppercase text-[#3a3733] transition hover:text-[#171614]"
                >
                  New Arrivals
                </Link>
                <Link
                  href="/products?sale=1"
                  className="text-xs font-medium tracking-[0.12em] uppercase text-[#8b5a42] transition hover:text-[#6f4430]"
                >
                  Sale
                </Link>
              </nav>
            </div>

            {/* Center: Brand Wordmark */}
            <div className="text-center">
              <Link
                href="/"
                className="font-serif text-xl sm:text-2xl font-normal tracking-[0.24em] uppercase text-[#171614] hover:opacity-90 transition"
              >
                Nova Threads
              </Link>
            </div>

            {/* Right: Search, Account, Wishlist, Cart */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:block">
                <SearchBar />
              </div>

              {/* Account Dropdown */}
              <div className="relative" ref={accountRef}>
                {user ? (
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((o) => !o)}
                    className="flex items-center gap-1.5 p-2 text-[#2b2824] transition hover:text-[#171614]"
                    aria-label="Account menu"
                    aria-expanded={accountMenuOpen}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0" />
                    </svg>
                    <span className="hidden text-xs font-medium tracking-wider xl:inline">
                      {user.name.split(" ")[0]}
                    </span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 p-2 text-[#2b2824] transition hover:text-[#171614]"
                    aria-label="Sign in"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0" />
                    </svg>
                    <span className="hidden text-xs font-medium tracking-[0.08em] uppercase xl:inline">
                      Sign In
                    </span>
                  </Link>
                )}

                {/* Account Menu Popup */}
                {accountMenuOpen && user && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-[#e5dfd5] bg-[#faf8f5] shadow-lg py-2">
                    <div className="border-b border-[#e5dfd5] px-4 py-2.5">
                      <p className="truncate text-xs font-semibold uppercase tracking-wider text-[#171614]">{user.name}</p>
                      <p className="truncate text-[11px] text-[#6b645b]">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-[#2b2824] hover:bg-[#f2ece2] transition"
                    >
                      Orders &amp; History
                    </Link>
                    <Link
                      href="/account?tab=addresses"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-[#2b2824] hover:bg-[#f2ece2] transition"
                    >
                      Saved Addresses
                    </Link>
                    <Link
                      href="/track"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-[#2b2824] hover:bg-[#f2ece2] transition"
                    >
                      Track Shipment
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-4 py-2 text-xs text-[#2b2824] hover:bg-[#f2ece2] transition border-t border-[#e5dfd5]"
                    >
                      Store Admin
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        void logout();
                      }}
                      className="block w-full px-4 py-2 text-left text-xs font-medium text-[#8b5a42] hover:bg-[#f2ece2] transition border-t border-[#e5dfd5]"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Wishlist Link with Live Counter */}
              <Link
                href="/wishlist"
                className="relative p-2 text-[#2b2824] transition hover:text-[#171614]"
                aria-label={`Saved items (${wishlistHydrated ? wishlistCount : 0})`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {wishlistHydrated && wishlistCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8b5a42] px-1 text-[10px] font-medium text-[#faf8f5]">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Bag with Live Counter */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2 text-[#2b2824] transition hover:text-[#171614]"
                aria-label={`Open shopping bag${cartHydrated && cartCount > 0 ? ` (${cartCount} items)` : ""}`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
                {cartHydrated && cartCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#171614] px-1 text-[10px] font-semibold text-[#faf8f5]">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-[#faf8f5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5dfd5] px-6 py-5">
              <span className="font-serif text-lg tracking-[0.2em] uppercase text-[#171614]">
                Nova Threads
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 text-[#615a51] hover:text-[#171614]"
                aria-label="Close navigation"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="border-b border-[#e5dfd5] px-6 py-4">
              <SearchBar />
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8c857b] font-medium mb-3">
                  Collections
                </p>
                <div className="space-y-3">
                  <Link
                    href="/products?category=women"
                    onClick={() => setMobileOpen(false)}
                    className="block font-serif text-xl text-[#171614] hover:text-[#8b5a42] transition"
                  >
                    Women
                  </Link>
                  <Link
                    href="/products?category=men"
                    onClick={() => setMobileOpen(false)}
                    className="block font-serif text-xl text-[#171614] hover:text-[#8b5a42] transition"
                  >
                    Men
                  </Link>
                  <Link
                    href="/products?category=kids"
                    onClick={() => setMobileOpen(false)}
                    className="block font-serif text-xl text-[#171614] hover:text-[#8b5a42] transition"
                  >
                    Kids
                  </Link>
                  <Link
                    href="/products?sort=newest"
                    onClick={() => setMobileOpen(false)}
                    className="block font-serif text-xl text-[#171614] hover:text-[#8b5a42] transition"
                  >
                    New Arrivals
                  </Link>
                  <Link
                    href="/products?sale=1"
                    onClick={() => setMobileOpen(false)}
                    className="block font-serif text-xl text-[#8b5a42] transition"
                  >
                    The Sale Edit
                  </Link>
                </div>
              </div>

              <div className="pt-6 border-t border-[#e5dfd5]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8c857b] font-medium mb-3">
                  Account &amp; Orders
                </p>
                <div className="space-y-2.5 text-sm text-[#3a3733]">
                  {user ? (
                    <>
                      <Link
                        href="/account"
                        onClick={() => setMobileOpen(false)}
                        className="block hover:text-[#171614]"
                      >
                        My Account ({user.name.split(" ")[0]})
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          void logout();
                        }}
                        className="block text-left text-[#8b5a42]"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block font-medium text-[#171614]"
                    >
                      Sign In / Register
                    </Link>
                  )}
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between hover:text-[#171614]"
                  >
                    <span>Saved Items</span>
                    {wishlistHydrated && wishlistCount > 0 && (
                      <span className="text-xs text-[#8b5a42]">({wishlistCount})</span>
                    )}
                  </Link>
                  <Link
                    href="/track"
                    onClick={() => setMobileOpen(false)}
                    className="block hover:text-[#171614]"
                  >
                    Track Shipment
                  </Link>
                  <Link
                    href="/support"
                    onClick={() => setMobileOpen(false)}
                    className="block hover:text-[#171614]"
                  >
                    Client Services &amp; FAQs
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block hover:text-[#171614] pt-2 text-xs text-[#8c857b]"
                  >
                    Store Admin Dashboard
                  </Link>
                </div>
              </div>
            </nav>

            <div className="border-t border-[#e5dfd5] bg-[#f5f0e8] px-6 py-4 text-xs text-[#736c62]">
              <p>Complimentary shipping over ₹999</p>
              <p className="mt-1">Standard 3–5 day delivery across India</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
