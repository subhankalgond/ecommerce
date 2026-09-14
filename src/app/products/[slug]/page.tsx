import Image from "next/image";
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
    title: product.name,
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

  const onSale = product.compareAtPrice !== undefined;
  const categoryLabel =
    product.category === "kids" ? "Kids" : `${product.category === "men" ? "Men" : "Women"}`;

  // Related products: same category, exclude self
  const related = allProducts()
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Reviews (server-rendered)
  const reviews = listReviews(product.id);
  const summary = reviewSummary(product.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <script dangerouslySetInnerHTML={{ __html: recordViewScript(product.slug) }} />
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-neutral-900 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/products?category=${product.category}`}
              className="capitalize hover:text-neutral-900 hover:underline"
            >
              {categoryLabel}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-neutral-900">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <ProductGallery image={product.image} alt={product.name} onSale={onSale} />

        {/* Details */}
        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            {categoryLabel}
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{product.name}</h1>

          {/* Ratings summary */}
          {summary.count > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-amber-500" aria-hidden>
                {"★".repeat(Math.round(summary.average))}
                <span className="text-neutral-300">
                  {"★".repeat(5 - Math.round(summary.average))}
                </span>
              </span>
              <span className="text-neutral-600">
                {summary.average} · {summary.count} review{summary.count === 1 ? "" : "s"}
              </span>
            </p>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
            {onSale && product.compareAtPrice && (
              <>
                <p className="text-lg text-neutral-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </p>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                  Save {formatPrice(product.compareAtPrice - product.price)}
                </span>
              </>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-neutral-600">
            {product.description}
          </p>

          {/* Stock availability */}
          <p className="mt-4 text-sm">
            {inStock ? (
              lowStock ? (
                <span className="font-medium text-amber-600">
                  ⚠ Only {stock} left in stock — order soon
                </span>
              ) : (
                <span className="font-medium text-emerald-600">✓ In stock</span>
              )
            ) : (
              <span className="font-medium text-rose-600">✗ Out of stock</span>
            )}
          </p>

          <div className="mt-8">
            <AddToCart product={product} inStock={inStock} />
          </div>

          {/* Delivery / pincode check */}
          <div className="mt-6">
            <PincodeCheck />
          </div>

          {/* Product details */}
          <div className="mt-10 border-t border-neutral-200 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Specifications
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li className="flex justify-between gap-4">
                <span>Colours</span>
                <span className="text-right text-neutral-900">
                  {product.colors.join(", ")}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Available sizes</span>
                <span className="text-right text-neutral-900">
                  {product.sizes.join(", ")}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span>SKU</span>
                <span className="text-right font-mono text-neutral-900">
                  NT-{product.id.toUpperCase()}
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Delivery</span>
                <span className="text-right text-neutral-900">
                  3–5 business days · free over ₹999
                </span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Returns</span>
                <span className="text-right text-neutral-900">
                  30-day free returns
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 border-t border-neutral-200 pt-10">
        <ProductReviews productId={product.id} initialReviews={reviews} summary={summary} />
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-neutral-200 pt-10">
          <h2 className="text-2xl font-bold">You may also like</h2>
          <p className="mt-1 text-sm text-neutral-500">
            More from {categoryLabel}&apos;s collection.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
