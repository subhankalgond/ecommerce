import Image from "next/image";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import ProductCard from "@/components/product-card";
import RecentlyViewed from "@/components/recently-viewed";
import { ratingMap } from "@/lib/reviews";

const CATEGORY_TILES = [
  {
    label: "Women",
    href: "/products?category=women",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop",
  },
  {
    label: "Men",
    href: "/products?category=men",
    image:
      "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=800&auto=format&fit=crop",
  },
  {
    label: "Kids",
    href: "/products?category=kids",
    image:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=800&auto=format&fit=crop",
  },
];

export default function HomePage() {
  const featured = PRODUCTS.filter((p) => p.featured);
  // New arrivals = last 5 catalog entries; best sellers = featured subset
  const newArrivals = PRODUCTS.slice(-5).reverse();
  const bestSellers = featured.slice(0, 4);
  const onSale = PRODUCTS.filter((p) => p.compareAtPrice !== undefined).slice(0, 4);
  const ids = [...featured, ...newArrivals, ...onSale].map((p) => p.id);
  const ratings = ratingMap([...new Set(ids)]);

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-neutral-900">
        <Image
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop"
          alt="Models wearing the new season collection"
          fill
          priority
          className="object-cover opacity-60"
          sizes="100vw"
        />
        <div className="relative z-10 px-4 text-center text-white">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-white/80">
            New season · New arrivals
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Dress the whole family in timeless style
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Everyday essentials for men, women and kids — crafted to last,
            priced to love.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
            >
              Shop all
            </Link>
            <Link
              href="/products?sale=1"
              className="rounded-full border border-white/60 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Shop sale
            </Link>
          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CATEGORY_TILES.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="group relative flex h-72 items-end overflow-hidden rounded-2xl bg-neutral-100"
            >
              <Image
                src={tile.image}
                alt={`Shop ${tile.label}`}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="relative z-10 flex w-full items-center justify-between p-5">
                <span className="text-xl font-semibold text-white">
                  {tile.label}
                </span>
                <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-neutral-900 transition group-hover:bg-white">
                  Shop now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">New arrivals</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Fresh off the design table — just landed.
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} rating={ratings[product.id]} />
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Featured picks</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Hand-selected favourites from this season.
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} rating={ratings[product.id]} />
          ))}
        </div>
      </section>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">Best sellers</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  The pieces our customers keep coming back for.
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} rating={ratings[product.id]} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Special offers */}
      {onSale.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-r from-rose-600 to-orange-500 p-8 sm:p-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="text-white">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/80">
                  Special offers
                </p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                  Season sale — up to 25% off
                </h2>
                <p className="mt-2 max-w-md text-sm text-white/90">
                  Extra ₹200 off ₹1,999+ with code{" "}
                  <span className="rounded bg-white/20 px-2 py-0.5 font-mono font-bold">FLAT200</span>{" "}
                  · 10% off ₹999+ with{" "}
                  <span className="rounded bg-white/20 px-2 py-0.5 font-mono font-bold">WELCOME10</span>
                </p>
              </div>
              <Link
                href="/products?sale=1"
                className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Shop the sale
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
              {onSale.map((product) => (
                <ProductCard key={product.id} product={product} rating={ratings[product.id]} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently viewed (client component, renders nothing when empty) */}
      <RecentlyViewed />

      {/* Trust strip */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 text-center sm:grid-cols-3 sm:px-6">
          <div>
            <p className="text-2xl">🚚</p>
            <p className="mt-2 text-sm font-semibold">Free shipping over ₹999</p>
            <p className="mt-1 text-sm text-neutral-500">
              Delivered to your door, 3–5 business days.
            </p>
          </div>
          <div>
            <p className="text-2xl">🔒</p>
            <p className="mt-2 text-sm font-semibold">Secure checkout</p>
            <p className="mt-1 text-sm text-neutral-500">
              Payments powered by Stripe. Your data stays safe.
            </p>
          </div>
          <div>
            <p className="text-2xl">↩️</p>
            <p className="mt-2 text-sm font-semibold">30-day returns</p>
            <p className="mt-1 text-sm text-neutral-500">
              Not a perfect fit? Send it back, no questions asked.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
