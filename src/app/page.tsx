import Image from "next/image";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import ProductCard from "@/components/product-card";
import RecentlyViewed from "@/components/recently-viewed";
import ThreeHeroCanvas from "@/components/three-hero-canvas";
import ThreeFabricStudio from "@/components/three-fabric-studio";
import NewsletterForm from "@/components/newsletter-form";

const CATEGORY_PORTFOLIOS = [
  {
    chapter: "Chapter 01",
    label: "Women's Wardrobe",
    subheading: "Fluid silks, crisp poplins, and tactile fine-gauge knitwear.",
    href: "/products?category=women",
    cta: "Explore Women",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1000&auto=format&fit=crop",
    aspect: "aspect-[3/4]",
  },
  {
    chapter: "Chapter 02",
    label: "Men's Tailoring & Casuals",
    subheading: "Durable Peruvian pima, relaxed selvedge, and structured wool coats.",
    href: "/products?category=men",
    cta: "Explore Men",
    image:
      "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000&auto=format&fit=crop",
    aspect: "aspect-[3/4]",
  },
  {
    chapter: "Chapter 03",
    label: "The Kids Collection",
    subheading: "Pure organic cottons and playful staples designed for freedom.",
    href: "/products?category=kids",
    cta: "Explore Kids",
    image:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=1000&auto=format&fit=crop",
    aspect: "aspect-[3/4]",
  },
];

export default function HomePage() {
  const featured = PRODUCTS.filter((p) => p.featured);
  const newArrivals = PRODUCTS.slice(-6).reverse();
  const curatedBestSellers = featured.slice(0, 4);
  const onSale = PRODUCTS.filter((p) => p.compareAtPrice !== undefined).slice(0, 4);

  return (
    <div className="space-y-20 sm:space-y-28 pb-20">
      
      {/* ── 1. Editorial Hero with Interactive Three.js WebGL Canvas ──────── */}
      <section className="relative overflow-hidden border-b border-[#e5dfd5] bg-[#f5f0e8] min-h-[85vh] flex items-center">
        {/* Subtle Interactive Three.js WebGL Ribbon Canvas */}
        <ThreeHeroCanvas />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            {/* Left Narrative */}
            <div className="lg:col-span-5 lg:pr-6">
              <div className="inline-flex items-center gap-2 border border-[#d8cfc2] bg-[#faf8f5]/80 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42] backdrop-blur-xs">
                <span>Autumn / Winter 2026</span>
                <span className="text-[#b5ac9d]">·</span>
                <span>Lookbook Vol. IV</span>
              </div>
              
              <h1 className="mt-5 font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.06] tracking-tight text-[#171614]">
                Everyday, <br className="hidden sm:inline" />
                <span className="italic">considered.</span>
              </h1>
              
              <p className="mt-6 text-sm sm:text-base leading-relaxed text-[#5e574e] max-w-lg">
                Thoughtful wardrobe essentials for men, women and kids. Disciplined proportions, unhurried craftsmanship, and enduring natural fibres made for the rhythm of daily life.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/products"
                  className="border border-[#171614] bg-[#171614] px-8 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-[#faf8f5] shadow-xs transition hover:bg-[#33302b]"
                >
                  Explore The Collection
                </Link>
                <Link
                  href="/products?sort=newest"
                  className="border border-[#171614] bg-[#faf8f5]/60 px-8 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-[#171614] backdrop-blur-xs transition hover:bg-[#ede6da]"
                >
                  New Arrivals
                </Link>
              </div>

              {/* Atelier Quality Badges */}
              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-[#ded6c9] pt-6 text-[10px] sm:text-[11px] uppercase tracking-wider text-[#736c62]">
                <div>
                  <span className="block font-serif text-base sm:text-lg font-medium text-[#171614]">100%</span>
                  <span>Pure Natural Fibres</span>
                </div>
                <div>
                  <span className="block font-serif text-base sm:text-lg font-medium text-[#171614]">3–5 Day</span>
                  <span>Pan-India Delivery</span>
                </div>
                <div>
                  <span className="block font-serif text-base sm:text-lg font-medium text-[#171614]">₹999+</span>
                  <span>Complimentary Shipping</span>
                </div>
              </div>
            </div>

            {/* Right Striking Editorial Campaign Visual Composition */}
            <div className="lg:col-span-7 grid grid-cols-12 gap-4 items-center">
              <div className="col-span-8 relative aspect-[4/5] overflow-hidden bg-[#ede8df] border border-[#e5dfd5] shadow-lg">
                <Image
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop"
                  alt="Nova Threads editorial campaign"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 70vw, 40vw"
                />
                <div className="absolute bottom-4 left-4 border border-[#e0d9cf] bg-[#faf8f5]/90 px-3 py-1.5 backdrop-blur-xs text-[10px] tracking-widest uppercase text-[#544e45]">
                  Campaign Main · Pure Twill &amp; Linen
                </div>
              </div>

              <div className="col-span-4 space-y-4">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#ede8df] border border-[#e5dfd5] shadow-sm">
                  <Image
                    src="https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop"
                    alt="Luxe Cashmere Knit"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 30vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="absolute bottom-2 left-2 text-[9px] uppercase tracking-widest text-white/90">
                    Tactile Knit
                  </span>
                </div>

                <div className="border border-[#ded6c9] bg-[#faf8f5]/80 p-4 backdrop-blur-xs">
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-[#8b5a42]">
                    Design Ethos
                  </span>
                  <p className="mt-1 font-serif text-xs text-[#171614] leading-relaxed">
                    “Clothes cut with purpose, refusing the distraction of passing trends.”
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Three Portfolios / Shop by Category ──────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e5dfd5] pb-5 gap-4">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
              Curated Wardrobe Chapters
            </span>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#171614]">
              Three Portfolios. One Distinct Aesthetic.
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold tracking-[0.16em] uppercase text-[#171614] hover:text-[#8b5a42] transition"
          >
            Explore Complete Catalogue →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {CATEGORY_PORTFOLIOS.map((item) => (
            <div key={item.label} className="group flex flex-col">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ede8df] border border-[#e5dfd5]">
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                <span className="absolute left-4 top-4 border border-white/60 bg-black/30 px-2.5 py-1 text-[10px] font-medium tracking-widest uppercase text-white backdrop-blur-xs">
                  {item.chapter}
                </span>
                <span className="absolute bottom-4 left-4 font-serif text-lg text-white">
                  {item.label}
                </span>
              </div>

              <div className="pt-4 flex-1 flex flex-col justify-between">
                <p className="text-xs leading-relaxed text-[#6b645b]">
                  {item.subheading}
                </p>
                <div className="mt-4">
                  <Link
                    href={item.href}
                    className="inline-flex items-center text-xs font-semibold tracking-[0.16em] uppercase text-[#171614] hover:text-[#8b5a42] transition"
                  >
                    {item.cta}
                    <span className="ml-2 font-normal transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Interactive ThreeUI Showcase: 3D Fabric & Weave Studio ──── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ThreeFabricStudio />
      </section>

      {/* ── 4. New Arrivals (Actual Database Products) ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e5dfd5] pb-5 gap-4">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
              Just Released
            </span>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#171614]">
              New Arrivals
            </h2>
            <p className="mt-1 text-xs text-[#6b645b]">
              The freshest additions to our permanent and seasonal catalogue.
            </p>
          </div>
          <Link
            href="/products?sort=newest"
            className="text-xs font-semibold tracking-[0.16em] uppercase text-[#171614] hover:text-[#8b5a42] transition"
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

      {/* ── 5. Seasonal Editorial Feature / Editorial Fashion Story ────── */}
      <section className="border-y border-[#e5dfd5] bg-[#f4efe6]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            <div className="relative aspect-[4/3] overflow-hidden lg:col-span-7 border border-[#e5dfd5] shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1400&auto=format&fit=crop"
                alt="Tactile materials and tailoring"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute bottom-4 left-4 border border-[#e0d9cf] bg-[#faf8f5]/90 px-3 py-1.5 backdrop-blur-xs text-[10px] tracking-widest uppercase text-[#544e45]">
                Fabric Focus · Pure Slub Twill
              </div>
            </div>

            <div className="lg:col-span-5 lg:pl-6">
              <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
                Editorial Fashion Story
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight text-[#171614]">
                The Architecture of Everyday Dressing
              </h2>
              <blockquote className="mt-5 border-l-2 border-[#8b5a42] pl-4 font-serif italic text-[#3f3b35] text-sm leading-relaxed">
                “True luxury in fashion isn&apos;t marked by loud ornamentation, but by the quiet weight of the drape, the softness of the collar, and garments that age with grace.”
              </blockquote>
              <p className="mt-5 text-xs sm:text-sm leading-relaxed text-[#615a51]">
                From dense Pima cottons that retain their collar shape wash after wash to 100% slub cotton oxfords woven for year-round ease, every piece in our catalogue is engineered with disciplined simplicity.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/products?category=men"
                  className="inline-block border border-[#171614] bg-[#171614] px-7 py-3 text-xs font-semibold tracking-[0.16em] uppercase text-white hover:bg-[#33302b] transition"
                >
                  Explore Men&apos;s Tailoring
                </Link>
                <Link
                  href="/products?category=women"
                  className="inline-block border border-[#171614] bg-transparent px-7 py-3 text-xs font-semibold tracking-[0.16em] uppercase text-[#171614] hover:bg-[#eae3d5] transition"
                >
                  Explore Women&apos;s Silhouettes
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. Best Sellers / Curated Wardrobe Anchors ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#e5dfd5] pb-5 gap-4">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
              Customer Favorites
            </span>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#171614]">
              Curated Wardrobe Anchors
            </h2>
            <p className="mt-1 text-xs text-[#6b645b]">
              The core silhouettes consistently selected across all customer wardrobes.
            </p>
          </div>
          <Link
            href="/products?sort=popular"
            className="text-xs font-semibold tracking-[0.16em] uppercase text-[#171614] hover:text-[#8b5a42] transition"
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

      {/* ── 7. Archival & Seasonal Promotional Offer ──────────────────── */}
      {onSale.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border border-[#ded6c9] bg-[#f5f1ea] p-8 sm:p-12 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#ded7ca] pb-8">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
                  Limited Opportunities
                </span>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[#171614]">
                  The Archival &amp; Seasonal Sale
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#615a51] max-w-xl leading-relaxed">
                  Save on select seasonal silhouettes. Use promotional coupon{" "}
                  <span className="border border-[#d1c8b9] bg-white px-2 py-0.5 font-mono text-xs font-semibold text-[#171614]">
                    FLAT200
                  </span>{" "}
                  for ₹200 off orders over ₹1,999, or{" "}
                  <span className="border border-[#d1c8b9] bg-white px-2 py-0.5 font-mono text-xs font-semibold text-[#171614]">
                    WELCOME10
                  </span>{" "}
                  for 10% off your entire order above ₹999.
                </p>
              </div>

              <Link
                href="/products?sale=1"
                className="inline-block shrink-0 border border-[#8b5a42] bg-[#8b5a42] px-8 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-white hover:bg-[#6f4430] transition text-center"
              >
                Shop The Sale Archive
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

      {/* ── 8. Recently Viewed Garments ─────────────────────────────────── */}
      <RecentlyViewed />

      {/* ── 9. Brand Commitments & Shopping Reassurance ─────────────────── */}
      <section className="border-t border-[#e5dfd5] bg-[#faf8f5] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            
            <div className="flex flex-col items-center text-center px-4">
              <div className="mb-4 flex h-12 w-12 items-center justify-center border border-[#d5cfc4] text-[#171614] bg-[#f5f0e8]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125h-9A1.125 1.125 0 002.25 3.75v10.5M16.5 7.5V14.25m-14.25 0h14.25" />
                </svg>
              </div>
              <h3 className="font-serif text-base text-[#171614]">Complimentary Shipping</h3>
              <p className="mt-1 text-xs text-[#6b645b] leading-relaxed">
                Free standard delivery on all domestic orders over ₹999. Dispatched in 1–2 business days.
              </p>
            </div>

            <div className="flex flex-col items-center text-center px-4">
              <div className="mb-4 flex h-12 w-12 items-center justify-center border border-[#d5cfc4] text-[#171614] bg-[#f5f0e8]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="font-serif text-base text-[#171614]">Verified Secure Checkout</h3>
              <p className="mt-1 text-xs text-[#6b645b] leading-relaxed">
                Protected transactions via Razorpay and Stripe. UPI, NetBanking, cards, and COD supported.
              </p>
            </div>

            <div className="flex flex-col items-center text-center px-4">
              <div className="mb-4 flex h-12 w-12 items-center justify-center border border-[#d5cfc4] text-[#171614] bg-[#f5f0e8]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
              <h3 className="font-serif text-base text-[#171614]">30-Day Easy Returns</h3>
              <p className="mt-1 text-xs text-[#6b645b] leading-relaxed">
                Simple doorstep pickup and prompt refund processing for unwashed and unworn garments.
              </p>
            </div>

            <div className="flex flex-col items-center text-center px-4">
              <div className="mb-4 flex h-12 w-12 items-center justify-center border border-[#d5cfc4] text-[#171614] bg-[#f5f0e8]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-serif text-base text-[#171614]">Natural Fiber Integrity</h3>
              <p className="mt-1 text-xs text-[#6b645b] leading-relaxed">
                100% GOTS organic cottons, pure linen flax, and unbleached cashmere with zero synthetic blends.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 10. The Journal / Newsletter Section ────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="border border-[#e0d9ce] bg-[#f5f1ea] p-8 sm:p-14">
          <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
            The Nova Threads Journal
          </span>
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl text-[#171614]">
            Stories of Material, Form &amp; Craft
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[#615a51] max-w-md mx-auto leading-relaxed">
            Subscribe to receive private collection previews, seasonal essays, and invitation-only promotions directly to your inbox.
          </p>
          <div className="mt-6 max-w-md mx-auto">
            <NewsletterForm />
          </div>
        </div>
      </section>

    </div>
  );
}
