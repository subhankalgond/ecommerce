import Image from "next/image";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import ProductCard from "@/components/product-card";
import RecentlyViewed from "@/components/recently-viewed";

const CATEGORY_STORIES = [
  {
    kicker: "Editorial Edit 01",
    label: "Women's Wardrobe",
    subheading: "Fluid silhouettes, crisp poplins, and tactile knitwear.",
    href: "/products?category=women",
    cta: "Explore Women",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1000&auto=format&fit=crop",
  },
  {
    kicker: "Editorial Edit 02",
    label: "Men's Tailoring & Casuals",
    subheading: "Durable pima tees, relaxed denims, and structured jackets.",
    href: "/products?category=men",
    cta: "Explore Men",
    image:
      "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000&auto=format&fit=crop",
  },
  {
    kicker: "Editorial Edit 03",
    label: "The Kids Collection",
    subheading: "Pure organic cottons and playful staples designed for freedom.",
    href: "/products?category=kids",
    cta: "Explore Kids",
    image:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function HomePage() {
  const featured = PRODUCTS.filter((p) => p.featured);
  // Real catalog arrivals
  const newArrivals = PRODUCTS.slice(-6).reverse();
  const curatedBestSellers = featured.slice(0, 4);
  const onSale = PRODUCTS.filter((p) => p.compareAtPrice !== undefined).slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* ── A. Editorial Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#e5dfd5] bg-[#f5f0e8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 py-12 lg:grid-cols-12 lg:py-20">
            
            {/* Left Narrative */}
            <div className="lg:col-span-5 lg:pr-6">
              <span className="inline-block text-[11px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
                Autumn / Winter 2026 Collection
              </span>
              
              <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-tight text-[#171614]">
                Everyday, considered.
              </h1>
              
              <p className="mt-5 text-sm sm:text-base leading-relaxed text-[#5e574e]">
                Thoughtful essentials for men, women and kids. Made for the way you live — built with enduring fabrics, clean cuts, and effortless versatility.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/products"
                  className="border border-[#171614] bg-[#171614] px-7 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-[#faf8f5] transition hover:bg-[#33302b]"
                >
                  Explore the collection
                </Link>
                <Link
                  href="/products?sort=newest"
                  className="border border-[#171614] bg-transparent px-7 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-[#171614] transition hover:bg-[#eae3d5]"
                >
                  Discover new arrivals
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-8 border-t border-[#e2dcd2] pt-6 text-[11px] uppercase tracking-wider text-[#736c62]">
                <div>
                  <span className="block font-serif text-base font-medium text-[#171614]">100%</span>
                  <span>Pure Cotton &amp; Wools</span>
                </div>
                <div className="h-6 w-px bg-[#d5cebf]" />
                <div>
                  <span className="block font-serif text-base font-medium text-[#171614]">3–5 Day</span>
                  <span>Pan-India Delivery</span>
                </div>
                <div className="h-6 w-px bg-[#d5cebf]" />
                <div>
                  <span className="block font-serif text-base font-medium text-[#171614]">Free</span>
                  <span>Over ₹999</span>
                </div>
              </div>
            </div>

            {/* Right Striking Campaign Image */}
            <div className="relative aspect-[4/5] overflow-hidden lg:col-span-7">
              <Image
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop"
                alt="Nova Threads editorial campaign"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
              <div className="absolute bottom-4 right-4 bg-[#faf8f5]/90 px-3 py-1.5 backdrop-blur-xs text-[10px] tracking-widest uppercase text-[#544e45]">
                Lookbook Issue No. 04 · Pure Linen &amp; Twill
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── B. Category Stories ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
            Curated Chapters
          </p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-[#171614]">
            Three Portfolios. One Aesthetic.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {CATEGORY_STORIES.map((story) => (
            <div key={story.label} className="group flex flex-col">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ede8df]">
                <Image
                  src={story.image}
                  alt={story.label}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                <span className="absolute left-4 top-4 border border-white/60 bg-black/30 px-2.5 py-1 text-[10px] font-medium tracking-widest uppercase text-white backdrop-blur-xs">
                  {story.kicker}
                </span>
              </div>

              <div className="pt-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl text-[#171614] group-hover:text-[#8b5a42] transition">
                    {story.label}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#6b645b]">
                    {story.subheading}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={story.href}
                    className="inline-flex items-center text-xs font-semibold tracking-[0.14em] uppercase text-[#171614] hover:text-[#8b5a42] transition"
                  >
                    {story.cta}
                    <span className="ml-2 font-normal transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── C. New Arrivals ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e5dfd5] pb-4 gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
              Just Released
            </p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#171614]">
              New Arrivals
            </h2>
            <p className="mt-1 text-xs text-[#6b645b]">
              The freshest additions to our permanent and seasonal catalogue.
            </p>
          </div>
          <Link
            href="/products?sort=newest"
            className="text-xs font-semibold tracking-[0.14em] uppercase text-[#171614] hover:text-[#8b5a42] transition"
          >
            View All New Arrivals →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ── D. Seasonal Editorial Feature ─────────────────────────────── */}
      <section className="border-y border-[#e5dfd5] bg-[#f4efe6]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            
            <div className="relative aspect-[4/3] overflow-hidden lg:col-span-7">
              <Image
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1400&auto=format&fit=crop"
                alt="Tactile materials and tailoring"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>

            <div className="lg:col-span-5 lg:pl-6">
              <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
                Material In Focus
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight text-[#171614]">
                The Texture of Daily Living
              </h2>
              <blockquote className="mt-4 border-l border-[#8b5a42] pl-4 font-serif italic text-[#3f3b35] text-sm leading-relaxed">
                “Garments shouldn&apos;t just look structured on the rack — they must breathe, soften with wash and wear, and adapt naturally to everyday movements.”
              </blockquote>
              <p className="mt-4 text-xs leading-relaxed text-[#615a51]">
                From dense Pima cottons that retain their collar shape to 100% slub cotton oxfords woven for year-round comfort, our collection balances ease with uncompromising craftsmanship.
              </p>
              <div className="mt-6">
                <Link
                  href="/products?category=men"
                  className="inline-block border border-[#171614] bg-[#171614] px-6 py-2.5 text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-[#33302b] transition"
                >
                  Explore Essentials
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── E. Best Sellers / Curated Picks ───────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e5dfd5] pb-4 gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
              Customer Favorites
            </p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#171614]">
              Curated Wardrobe Anchors
            </h2>
            <p className="mt-1 text-xs text-[#6b645b]">
              The core pieces consistently selected across all wardrobes.
            </p>
          </div>
          <Link
            href="/products?sort=popular"
            className="text-xs font-semibold tracking-[0.14em] uppercase text-[#171614] hover:text-[#8b5a42] transition"
          >
            Explore All Favorites →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-4">
          {curatedBestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ── F. Sale Edit (Restrained, Editorial) ────────────────────────── */}
      {onSale.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border border-[#e2dcd2] bg-[#f5f1ea] p-8 sm:p-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#ded7ca] pb-8">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
                  Limited Opportunities
                </span>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[#171614]">
                  The Archival &amp; Seasonal Sale
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#615a51] max-w-xl">
                  Save on select seasonal silhouettes. Use promotional code{" "}
                  <span className="border border-[#d1c8b9] bg-white px-2 py-0.5 font-mono text-xs font-semibold text-[#171614]">
                    FLAT200
                  </span>{" "}
                  for ₹200 off orders over ₹1,999, or{" "}
                  <span className="border border-[#d1c8b9] bg-white px-2 py-0.5 font-mono text-xs font-semibold text-[#171614]">
                    WELCOME10
                  </span>{" "}
                  for 10% off orders above ₹999.
                </p>
              </div>

              <Link
                href="/products?sale=1"
                className="inline-block shrink-0 border border-[#8b5a42] bg-[#8b5a42] px-7 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-white hover:bg-[#6f4430] transition text-center"
              >
                Shop The Sale Edit
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4">
              {onSale.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Recently Viewed ────────────────────────────────────────────── */}
      <RecentlyViewed />

      {/* ── G. Shopping Reassurance (Clean minimalist SVGs) ───────────── */}
      <section className="border-t border-[#e5dfd5] bg-[#faf8f5] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
            
            <div className="flex flex-col items-center px-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center border border-[#d5cfc4] text-[#171614]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125h-9A1.125 1.125 0 002.25 3.75v10.5M16.5 7.5V14.25m-14.25 0h14.25" />
                </svg>
              </div>
              <h3 className="font-serif text-base text-[#171614]">Complimentary Shipping</h3>
              <p className="mt-1 text-xs text-[#6b645b] max-w-xs leading-relaxed">
                Free standard delivery on all domestic orders over ₹999. Dispatched in 1–2 business days.
              </p>
            </div>

            <div className="flex flex-col items-center px-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center border border-[#d5cfc4] text-[#171614]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="font-serif text-base text-[#171614]">Verified Secure Checkout</h3>
              <p className="mt-1 text-xs text-[#6b645b] max-w-xs leading-relaxed">
                Protected transactions via Razorpay and Stripe. UPI, NetBanking, cards, and COD supported.
              </p>
            </div>

            <div className="flex flex-col items-center px-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center border border-[#d5cfc4] text-[#171614]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
              <h3 className="font-serif text-base text-[#171614]">30-Day Easy Returns</h3>
              <p className="mt-1 text-xs text-[#6b645b] max-w-xs leading-relaxed">
                Simple doorstep pickup and prompt refund processing for unwashed and unworn items with tags.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
