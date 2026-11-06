"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { useCustomer } from "@/components/customer-auth-provider";
import SearchBar from "@/components/search-bar";

interface MegaMenuContent {
  title: string;
  subtitle: string;
  columns: {
    heading: string;
    links: { label: string; href: string }[];
  }[];
  featured: {
    tag: string;
    title: string;
    image: string;
    href: string;
  };
}

const MEGA_MENUS: Record<string, MegaMenuContent> = {
  women: {
    title: "The Women's Collection",
    subtitle: "Fluid silhouettes, crisp poplins, liquid silks, and tactile knitwear.",
    columns: [
      {
        heading: "Wardrobe Essentials",
        links: [
          { label: "View All Women", href: "/products?category=women" },
          { label: "Dresses & Wraps", href: "/products?category=women&q=dress" },
          { label: "Blouses & Silk Tops", href: "/products?category=women&q=blouse" },
          { label: "Cashmere & Knitwear", href: "/products?category=women&q=sweater" },
          { label: "Denim & Trousers", href: "/products?category=women&q=denim" },
        ],
      },
      {
        heading: "Curated Stories",
        links: [
          { label: "New Arrivals", href: "/products?category=women&sort=newest" },
          { label: "Customer Favorites", href: "/products?category=women&sort=popular" },
          { label: "The Silk Capsule", href: "/products?category=women&q=silk" },
          { label: "Sale Archive", href: "/products?category=women&sale=1" },
        ],
      },
    ],
    featured: {
      tag: "Lookbook No. 04",
      title: "Tactile Silk & Linen Drape",
      image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800&auto=format&fit=crop",
      href: "/products?category=women",
    },
  },
  men: {
    title: "Men's Tailoring & Casuals",
    subtitle: "Durable pima tees, relaxed selvedge, and structured wool overcoats.",
    columns: [
      {
        heading: "Garment Categories",
        links: [
          { label: "View All Men", href: "/products?category=men" },
          { label: "Oxford & Twill Shirts", href: "/products?category=men&q=shirt" },
          { label: "Heritage Jackets & Coats", href: "/products?category=men&q=jacket" },
          { label: "Pima Cotton Tees", href: "/products?category=men&q=tee" },
          { label: "Motion Shorts & Pants", href: "/products?category=men&q=shorts" },
        ],
      },
      {
        heading: "Curated Edits",
        links: [
          { label: "New Arrivals", href: "/products?category=men&sort=newest" },
          { label: "Workplace & Formal", href: "/products?category=men&q=oxford" },
          { label: "Casual Outerwear", href: "/products?category=men&q=bomber" },
          { label: "Sale Archive", href: "/products?category=men&sale=1" },
        ],
      },
    ],
    featured: {
      tag: "Permanent Edit",
      title: "Quiet Luxury Wool Overcoats",
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop",
      href: "/products?category=men",
    },
  },
  kids: {
    title: "The Kids Collection",
    subtitle: "Pure organic cottons and playful staples designed for freedom and movement.",
    columns: [
      {
        heading: "Age & Styles",
        links: [
          { label: "View All Kids", href: "/products?category=kids" },
          { label: "Organic Stripe Tees", href: "/products?category=kids&q=tee" },
          { label: "Playful Cotton Dresses", href: "/products?category=kids&q=dress" },
          { label: "Chunky Knit Cardigans", href: "/products?category=kids&q=cardigan" },
          { label: "Mesh Slip-on Sneakers", href: "/products?category=kids&q=sneaker" },
        ],
      },
      {
        heading: "Considered Details",
        links: [
          { label: "GOTS-Certified Organic", href: "/products?category=kids&q=organic" },
          { label: "New Kids Arrivals", href: "/products?category=kids&sort=newest" },
          { label: "Customer Favorites", href: "/products?category=kids&sort=popular" },
          { label: "Sale Archive", href: "/products?category=kids&sale=1" },
        ],
      },
    ],
    featured: {
      tag: "Organic Edit",
      title: "Chunky Knit Cardigans & Tops",
      image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=800&auto=format&fit=crop",
      href: "/products?category=kids",
    },
  },
};

export default function Header() {
  const { count: cartCount, hydrated: cartHydrated, openCart } = useCart();
  const { count: wishlistCount, hydrated: wishlistHydrated } = useWishlist();
  const { user, logout } = useCustomer();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  const handleMouseEnter = (key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(key);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 180);
  };

  return (
    <>
      {/* Editorial Announcement Bar */}
      <div className="border-b border-[#e5dfd5] bg-[#f5f0e8] px-4 py-2 text-center text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase text-[#615a51]">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
          <span>Complimentary Delivery on Orders Over ₹999</span>
          <span className="text-[#b5ac9e]">|</span>
          <span>
            Use Code <strong className="font-semibold text-[#171614] tracking-widest">WELCOME10</strong> for 10% Off
          </span>
          <span className="hidden md:inline text-[#b5ac9e]">|</span>
          <span className="hidden md:inline text-[#8b5a42]">
            Pan-India Express Dispatch
          </span>
        </div>
      </div>

      <header
        className="sticky top-0 z-40 border-b border-[#e5dfd5] bg-[#faf8f5]/95 backdrop-blur-md"
        onMouseLeave={handleMouseLeave}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between gap-4">
            
            {/* Left: Mobile hamburger & primary categories with Mega Menu trigger */}
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
                <div
                  className="relative py-6"
                  onMouseEnter={() => handleMouseEnter("women")}
                >
                  <Link
                    href="/products?category=women"
                    className={`text-xs font-medium tracking-[0.16em] uppercase transition ${
                      activeMenu === "women" ? "text-[#8b5a42]" : "text-[#3a3733] hover:text-[#171614]"
                    }`}
                  >
                    Women
                  </Link>
                </div>

                <div
                  className="relative py-6"
                  onMouseEnter={() => handleMouseEnter("men")}
                >
                  <Link
                    href="/products?category=men"
                    className={`text-xs font-medium tracking-[0.16em] uppercase transition ${
                      activeMenu === "men" ? "text-[#8b5a42]" : "text-[#3a3733] hover:text-[#171614]"
                    }`}
                  >
                    Men
                  </Link>
                </div>

                <div
                  className="relative py-6"
                  onMouseEnter={() => handleMouseEnter("kids")}
                >
                  <Link
                    href="/products?category=kids"
                    className={`text-xs font-medium tracking-[0.16em] uppercase transition ${
                      activeMenu === "kids" ? "text-[#8b5a42]" : "text-[#3a3733] hover:text-[#171614]"
                    }`}
                  >
                    Kids
                  </Link>
                </div>

                <Link
                  href="/products?sort=newest"
                  onMouseEnter={handleMouseLeave}
                  className="text-xs font-medium tracking-[0.16em] uppercase text-[#3a3733] hover:text-[#171614] transition py-6"
                >
                  New Arrivals
                </Link>

                <Link
                  href="/products?sale=1"
                  onMouseEnter={handleMouseLeave}
                  className="text-xs font-semibold tracking-[0.16em] uppercase text-[#8b5a42] hover:text-[#6f4430] transition py-6"
                >
                  Sale Edit
                </Link>
              </nav>
            </div>

            {/* Center: Brand Wordmark */}
            <div className="text-center">
              <Link
                href="/"
                className="font-serif text-xl sm:text-2xl font-normal tracking-[0.26em] uppercase text-[#171614] hover:opacity-85 transition"
              >
                Nova Threads
              </Link>
            </div>

            {/* Right: Search, Account, Wishlist, Cart */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:block w-48 md:w-60">
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
                    <span className="hidden text-xs font-medium tracking-[0.1em] uppercase xl:inline">
                      Account
                    </span>
                  </Link>
                )}

                {/* Account Menu Popup */}
                {accountMenuOpen && user && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 border border-[#e5dfd5] bg-[#faf8f5] shadow-xl py-2">
                    <div className="border-b border-[#e5dfd5] px-4 py-3">
                      <p className="truncate text-xs font-semibold uppercase tracking-wider text-[#171614]">{user.name}</p>
                      <p className="truncate text-[11px] text-[#6b645b]">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs text-[#2b2824] hover:bg-[#f2ece2] transition"
                    >
                      Orders &amp; History
                    </Link>
                    <Link
                      href="/account?tab=addresses"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs text-[#2b2824] hover:bg-[#f2ece2] transition"
                    >
                      Saved Addresses
                    </Link>
                    <Link
                      href="/track"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs text-[#2b2824] hover:bg-[#f2ece2] transition"
                    >
                      Track Shipment
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-4 py-2.5 text-xs text-[#2b2824] hover:bg-[#f2ece2] transition border-t border-[#e5dfd5]"
                    >
                      Store Admin
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        void logout();
                      }}
                      className="block w-full px-4 py-2.5 text-left text-xs font-medium text-[#8b5a42] hover:bg-[#f2ece2] transition border-t border-[#e5dfd5]"
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

        {/* Desktop Mega Menu Dropdown */}
        {activeMenu && MEGA_MENUS[activeMenu] && (
          <div
            className="absolute inset-x-0 top-full border-b border-[#e5dfd5] bg-[#faf8f5] shadow-xl animate-fade-in"
            onMouseEnter={() => handleMouseEnter(activeMenu)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="grid grid-cols-12 gap-8 items-start">
                
                {/* Intro column */}
                <div className="col-span-3 border-r border-[#ede6da] pr-6">
                  <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
                    Editorial Portfolio
                  </span>
                  <h3 className="mt-1 font-serif text-2xl text-[#171614]">
                    {MEGA_MENUS[activeMenu].title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#615a51]">
                    {MEGA_MENUS[activeMenu].subtitle}
                  </p>
                  <Link
                    href={`/products?category=${activeMenu}`}
                    onClick={() => setActiveMenu(null)}
                    className="mt-6 inline-block text-xs font-semibold tracking-wider uppercase text-[#171614] hover:text-[#8b5a42] transition underline underline-offset-4"
                  >
                    Explore Complete Edit →
                  </Link>
                </div>

                {/* Subcategory Link Columns */}
                {MEGA_MENUS[activeMenu].columns.map((col, idx) => (
                  <div key={idx} className="col-span-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c857b]">
                      {col.heading}
                    </p>
                    <ul className="mt-4 space-y-3">
                      {col.links.map((link) => (
                        <li key={`${col.heading}-${link.label}`}>
                          <Link
                            href={link.href}
                            onClick={() => setActiveMenu(null)}
                            className="text-xs text-[#3a3733] hover:text-[#8b5a42] transition"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Editorial Featured Photography Card */}
                <div className="col-span-3">
                  <Link
                    href={MEGA_MENUS[activeMenu].featured.href}
                    onClick={() => setActiveMenu(null)}
                    className="group block relative aspect-[4/5] overflow-hidden bg-[#ede8df] border border-[#e5dfd5]"
                  >
                    <Image
                      src={MEGA_MENUS[activeMenu].featured.image}
                      alt={MEGA_MENUS[activeMenu].featured.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="280px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />
                    <div className="absolute inset-x-3 bottom-3 text-white">
                      <span className="text-[9px] font-semibold tracking-widest uppercase text-white/80">
                        {MEGA_MENUS[activeMenu].featured.tag}
                      </span>
                      <p className="font-serif text-sm font-normal text-white mt-0.5">
                        {MEGA_MENUS[activeMenu].featured.title}
                      </p>
                    </div>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        )}
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
          <div className="relative flex w-full max-w-sm flex-1 flex-col bg-[#faf8f5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5dfd5] px-6 py-5">
              <span className="font-serif text-lg tracking-[0.2em] uppercase text-[#171614]">
                Nova Threads
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 text-[#615a51] hover:text-[#171614] transition"
                aria-label="Close navigation"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 border-b border-[#e5dfd5]">
              <SearchBar />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b5a42]">
                  Portfolios &amp; Edits
                </p>
                <div className="mt-3 flex flex-col space-y-3 font-serif text-lg text-[#171614]">
                  <Link
                    href="/products?category=women"
                    onClick={() => setMobileOpen(false)}
                    className="hover:text-[#8b5a42] transition flex items-center justify-between"
                  >
                    <span>Women</span>
                    <span className="font-sans text-xs text-[#8c857b]">→</span>
                  </Link>
                  <Link
                    href="/products?category=men"
                    onClick={() => setMobileOpen(false)}
                    className="hover:text-[#8b5a42] transition flex items-center justify-between"
                  >
                    <span>Men</span>
                    <span className="font-sans text-xs text-[#8c857b]">→</span>
                  </Link>
                  <Link
                    href="/products?category=kids"
                    onClick={() => setMobileOpen(false)}
                    className="hover:text-[#8b5a42] transition flex items-center justify-between"
                  >
                    <span>Kids</span>
                    <span className="font-sans text-xs text-[#8c857b]">→</span>
                  </Link>
                  <Link
                    href="/products?sort=newest"
                    onClick={() => setMobileOpen(false)}
                    className="hover:text-[#8b5a42] transition flex items-center justify-between"
                  >
                    <span>New Arrivals</span>
                    <span className="font-sans text-xs text-[#8c857b]">New</span>
                  </Link>
                  <Link
                    href="/products?sale=1"
                    onClick={() => setMobileOpen(false)}
                    className="text-[#8b5a42] hover:text-[#6f4430] transition flex items-center justify-between"
                  >
                    <span>Sale Archive</span>
                    <span className="font-sans text-xs text-[#8b5a42]">Offers</span>
                  </Link>
                </div>
              </div>

              <div className="border-t border-[#ede6da] pt-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b5a42]">
                  Client Services
                </p>
                <div className="mt-3 space-y-2.5 text-xs text-[#544e45]">
                  <Link
                    href="/track"
                    onClick={() => setMobileOpen(false)}
                    className="block font-medium text-[#171614] hover:underline"
                  >
                    Track Order Shipment →
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="block hover:text-[#171614]"
                  >
                    Saved Garments ({wishlistHydrated ? wishlistCount : 0})
                  </Link>
                  <Link
                    href="/support"
                    onClick={() => setMobileOpen(false)}
                    className="block hover:text-[#171614]"
                  >
                    Customer Care &amp; Size Guide
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="block hover:text-[#171614]"
                  >
                    Account &amp; Addresses
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block hover:text-[#171614] text-[#8c857b]"
                  >
                    Store Admin Access
                  </Link>
                </div>
              </div>

              {/* Mobile Lookbook Card */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#ede8df] border border-[#e5dfd5]">
                <Image
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop"
                  alt="Campaign"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 p-4 flex flex-col justify-end text-white">
                  <span className="text-[9px] tracking-widest uppercase">Autumn / Winter Edit</span>
                  <p className="font-serif text-sm">Everyday, considered.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#e5dfd5] bg-[#f5f0e8] px-6 py-4 text-center text-[10px] tracking-wider uppercase text-[#7a7368]">
              Complimentary Delivery Over ₹999
            </div>
          </div>
        </div>
      )}
    </>
  );
}
