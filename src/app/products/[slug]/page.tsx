import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PRODUCTS, formatPrice, getProductBySlug } from "@/lib/products";
import { allProducts, isEnabled } from "@/lib/product-store";
import { getStock } from "@/lib/orders";
import { listReviews, reviewSummary } from "@/lib/reviews";
import ProductCard from "@/components/product-card";
import AddToCart from "./add-to-cart";
import ProductGallery from "./gallery";
import ProductReviews from "./reviews";
import PincodeCheck from "./pincode-check";
import { recordViewScript } from "./view-tracker";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — Nova Threads`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = allProducts().find((p) => p.slug === slug);
  if (!product || !isEnabled(product.id)) notFound();

  const stock = getStock(product.id);
  const inStock = stock === null || stock > 0;
  const lowStock = stock !== null && stock > 0 && stock <= 5;

  const onSale = product.compareAtPrice !== undefined && product.compareAtPrice > product.price;
  const categoryLabel =
    product.category === "kids" ? "Kids" : `${product.category === "men" ? "Men" : "Women"}`;

  // Related products from the same category
  const related = allProducts()
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Reviews
  const reviews = listReviews(product.id);
  const summary = reviewSummary(product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script dangerouslySetInnerHTML={{ __html: recordViewScript(product.slug) }} />
      
      {/* Editorial Breadcrumbs */}
      <nav aria-label="Breadcrumbs" className="text-xs text-[#8c857b]">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-[#171614] transition">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/products?category=${product.category}`}
              className="capitalize hover:text-[#171614] transition"
            >
              {categoryLabel}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-[#171614]">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main Product Showcase */}
      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-12">
        
        {/* Left Column: Gallery (7 Cols on desktop) */}
        <div className="lg:col-span-7">
          <ProductGallery image={product.image} alt={product.name} onSale={onSale} />
        </div>

        {/* Right Column: Narrative, Variants & Actions (5 Cols on desktop) */}
        <div className="flex flex-col lg:col-span-5">
          <div className="border-b border-[#e5dfd5] pb-6">
            <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
              {categoryLabel}&apos;s Wardrobe · SKU NT-{product.id.toUpperCase()}
            </span>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-[#171614] leading-tight">
              {product.name}
            </h1>

            {/* Ratings summary */}
            {summary.count > 0 && (
              <p className="mt-2.5 flex items-center gap-2 text-xs text-[#615a51]">
                <span className="text-[#8b5a42] tracking-widest">
                  {"★".repeat(Math.round(summary.average))}
                  <span className="text-[#d5cebf]">{"★".repeat(5 - Math.round(summary.average))}</span>
                </span>
                <span>
                  {summary.average} · {summary.count} review{summary.count === 1 ? "" : "s"}
                </span>
              </p>
            )}

            {/* Pricing */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-xl sm:text-2xl font-bold text-[#171614]">
                {formatPrice(product.price)}
              </span>
              {onSale && product.compareAtPrice && (
                <>
                  <span className="text-sm text-[#9c958a] line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="border border-[#8b5a42] bg-[#faf8f5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b5a42]">
                    Save {formatPrice(product.compareAtPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Stock status indicator */}
            <div className="mt-3 text-xs">
              {inStock ? (
                lowStock ? (
                  <span className="text-[#8b5a42] font-medium">
                    Limited Availability · Only {stock} pieces remaining
                  </span>
                ) : (
                  <span className="text-[#515c4d] font-medium">
                    ✓ Available for immediate dispatch
                  </span>
                )
              ) : (
                <span className="text-[#8b5a42] font-semibold">
                  Archival Piece · Currently Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="py-6 border-b border-[#e5dfd5]">
            <p className="text-xs sm:text-sm leading-relaxed text-[#544e45]">
              {product.description}
            </p>
          </div>

          {/* Variants and Add to Cart Section */}
          <div className="py-6 border-b border-[#e5dfd5]">
            <AddToCart product={product} inStock={inStock} />
          </div>

          {/* Postal Code Dispatch Checker */}
          <div className="py-6 border-b border-[#e5dfd5]">
            <PincodeCheck />
          </div>

          {/* Garment Specifications & Details */}
          <div className="pt-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8c857b] mb-4">
              Garment Specifications &amp; Care
            </h2>
            <dl className="divide-y divide-[#ede6da] text-xs">
              <div className="flex justify-between py-2">
                <dt className="text-[#736c62]">Available Colours</dt>
                <dd className="font-medium text-[#171614]">{product.colors.join(", ")}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[#736c62]">Standard Sizing</dt>
                <dd className="font-medium text-[#171614]">{product.sizes.join(", ")}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[#736c62]">Domestic Delivery</dt>
                <dd className="font-medium text-[#171614]">3–5 business days · Complimentary over ₹999</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[#736c62]">Returns &amp; Exchanges</dt>
                <dd className="font-medium text-[#171614]">30-day effortless doorstep return service</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[#736c62]">Care Recommendation</dt>
                <dd className="font-medium text-[#171614]">Cold delicate wash with mild detergent; line dry in shade</dd>
              </div>
            </dl>
          </div>

        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="mt-20 border-t border-[#e5dfd5] pt-12">
        <ProductReviews productId={product.id} initialReviews={reviews} summary={summary} />
      </section>

      {/* Related Products / Curated Companions */}
      {related.length > 0 && (
        <section className="mt-20 border-t border-[#e5dfd5] pt-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#8b5a42]">
                Complete The Look
              </span>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#171614]">
                Related From The {categoryLabel} Edit
              </h2>
            </div>
            <Link
              href={`/products?category=${product.category}`}
              className="text-xs font-semibold tracking-wider uppercase text-[#171614] hover:text-[#8b5a42] transition"
            >
              Explore {categoryLabel}&apos;s Collection →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
