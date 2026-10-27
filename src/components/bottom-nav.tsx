"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWishlist } from "@/components/wishlist-provider";
import { useCart } from "@/components/cart-provider";

export default function BottomNav() {
  const pathname = usePathname();
  const { count: wishlistCount, hydrated: wishlistHydrated } = useWishlist();
  const { count: cartCount, hydrated: cartHydrated, openCart } = useCart();

  const links = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
      icon: (
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.125 1.125 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
        </svg>
      ),
    },
    {
      href: "/products",
      label: "Shop",
      active: pathname.startsWith("/products"),
      icon: (
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      ),
    },
    {
      href: "/wishlist",
      label: "Saved",
      active: pathname.startsWith("/wishlist"),
      badge: wishlistHydrated && wishlistCount > 0 ? wishlistCount : null,
      icon: (
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
    },
    {
      href: "/track",
      label: "Orders",
      active: pathname.startsWith("/track"),
      icon: (
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3-12h.75a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 016 3.75h.75m4.5 0h4.5m-4.5 0a2.25 2.25 0 00-2.25 2.25v.75h9V6a2.25 2.25 0 00-2.25-2.25z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e5dfd5] bg-[#faf8f5]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium tracking-wider uppercase transition ${
              link.active ? "text-[#171614] font-semibold" : "text-[#7a7368]"
            }`}
          >
            <div className="relative">
              {link.icon}
              {link.badge !== null && link.badge !== undefined && (
                <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#8b5a42] px-0.5 text-[8px] font-bold text-white">
                  {link.badge}
                </span>
              )}
            </div>
            <span>{link.label}</span>
            {link.active && (
              <span className="absolute top-0 inset-x-6 h-0.5 bg-[#171614]" />
            )}
          </Link>
        ))}

        {/* Bag Trigger Button */}
        <button
          type="button"
          onClick={openCart}
          className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium tracking-wider uppercase text-[#7a7368] hover:text-[#171614] transition"
        >
          <div className="relative">
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
            {cartHydrated && cartCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#171614] px-0.5 text-[8px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </div>
          <span>Bag</span>
        </button>
      </div>
    </nav>
  );
}
