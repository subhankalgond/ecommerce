export type Category = "men" | "women" | "kids";

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Price in paise (1 INR = 100 paise) */
  price: number;
  /** Original price in paise, shown struck-through for sale items */
  compareAtPrice?: number;
  category: Category;
  sizes: string[];
  colors: string[];
  image: string;
  tags: string[];
  featured?: boolean;
}

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

// search.ts imports PRODUCTS from this module, so the cycle is resolved lazily
// (both modules only touch each other's bindings at call time).
import { searchProducts as fuzzySearch } from "@/lib/search";

export const PRODUCTS: Product[] = [
  // ── Men ────────────────────────────────────────────────────────────────
  {
    id: "m1",
    slug: "skyline-oxford-shirt",
    name: "Skyline Oxford Shirt",
    description:
      "A crisp cotton oxford with a regular fit and button-down collar. Breathable enough for summer, sharp enough for the office.",
    price: 149900,
    compareAtPrice: 199900,
    category: "men",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["White", "Sky Blue"],
    image: img("1576566588028-4147f3842f27"),
    tags: ["shirts"],
    featured: true,
  },
  {
    id: "m2",
    slug: "heritage-denim-jacket",
    name: "Heritage Denim Jacket",
    description:
      "A rugged trucker-style denim jacket with a slight stretch, built to break in beautifully over the years.",
    price: 349900,
    category: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Mid Blue"],
    image: img("1551028719-00167b16eac5"),
    tags: ["jackets"],
    featured: true,
  },
  {
    id: "m3",
    slug: "quiet-luxury-overcoat",
    name: "Quiet Luxury Overcoat",
    description:
      "An elegant wool-blend overcoat with a clean silhouette. The winter layer that ties every outfit together.",
    price: 699900,
    compareAtPrice: 849900,
    category: "men",
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Charcoal"],
    image: img("1591047139829-d91aecb6caea"),
    tags: ["jackets"],
  },
  {
    id: "m4",
    slug: "essential-pima-tee",
    name: "Essential Pima Tee",
    description:
      "Premium pima cotton tee with a dense knit that keeps its shape wash after wash. The everyday staple.",
    price: 89900,
    category: "men",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White", "Navy"],
    image: img("1521572163474-6864f9cf17ab"),
    tags: ["t-shirts"],
  },
  {
    id: "m5",
    slug: "motion-athletic-shorts",
    name: "Motion Athletic Shorts",
    description:
      "Lightweight shorts with a stretchy elastic waist and zip pocket. From morning runs to lazy Sundays.",
    price: 129900,
    category: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Grey", "Black"],
    image: img("1503341504253-dff4815485f1"),
    tags: ["shorts"],
  },
  {
    id: "m6",
    slug: "atelier-bomber-jacket",
    name: "Atelier Bomber Jacket",
    description:
      "A modern bomber with ribbed trims and a matte finish. Adds instant structure to any casual look.",
    price: 449900,
    category: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Olive"],
    image: img("1551537482-f2075a1d41f2"),
    tags: ["jackets"],
    featured: true,
  },

  // ── Women ──────────────────────────────────────────────────────────────
  {
    id: "w1",
    slug: "everly-wrap-dress",
    name: "Everly Wrap Dress",
    description:
      "A flowing midi wrap dress that flatters every figure. Made from soft crepe that moves with you.",
    price: 299900,
    compareAtPrice: 379900,
    category: "women",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blush", "Black"],
    image: img("1595777457583-95e059d581b8"),
    tags: ["dresses"],
    featured: true,
  },
  {
    id: "w2",
    slug: "luxe-cashmere-sweater",
    name: "Luxe Cashmere Sweater",
    description:
      "Impossibly soft cashmere crew-neck. Warm without the weight, and forever in style.",
    price: 549900,
    category: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Grey", "Cream"],
    image: img("1434389677669-e08b4cac3105"),
    tags: ["sweaters"],
    featured: true,
  },
  {
    id: "w3",
    slug: "serene-silk-blouse",
    name: "Serene Silk Blouse",
    description:
      "Liquid-soft silk blouse with a relaxed cut and mother-of-pearl buttons. Dress it up or down.",
    price: 379900,
    category: "women",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Champagne", "White"],
    image: img("1496747611176-843222e1e57c"),
    tags: ["tops"],
  },
  {
    id: "w4",
    slug: "muse-linen-dress",
    name: "Muse Linen Dress",
    description:
      "Breathable European linen with delicate covered buttons. Your go-to for warm, golden afternoons.",
    price: 249900,
    compareAtPrice: 329900,
    category: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Stone"],
    image: img("1520006403909-838d6b92c22e"),
    tags: ["dresses"],
  },
  {
    id: "w5",
    slug: "vida-leather-handbag",
    name: "Vida Leather Handbag",
    description:
      "Full-grain leather handbag with a structured silhouette and interior card slots. Ages beautifully.",
    price: 499900,
    category: "women",
    sizes: ["One Size"],
    colors: ["Black", "Tan"],
    image: img("1548036328-c9fa89d128fa"),
    tags: ["accessories"],
  },
  {
    id: "w6",
    slug: "drift-denim-trousers",
    name: "Drift Denim Trousers",
    description:
      "High-rise, wide-leg denim trousers in a rigid wash that softens perfectly over time.",
    price: 219900,
    category: "women",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Indigo"],
    image: img("1541099649105-f69ad21f3246"),
    tags: ["jeans"],
    featured: true,
  },

  // ── Kids ───────────────────────────────────────────────────────────────
  {
    id: "k1",
    slug: "sprout-stripe-tee",
    name: "Sprout Stripe Tee",
    description:
      "GOTS-certified organic cotton tee in a cheerful stripe. Pre-shrunk and tag-free for zero itches.",
    price: 59900,
    category: "kids",
    sizes: ["2Y", "4Y", "6Y", "8Y", "10Y"],
    colors: ["Yellow", "Blue"],
    image: img("1519238263530-99bdd11df2ea"),
    tags: ["t-shirts"],
    featured: true,
  },
  {
    id: "k2",
    slug: "nimble-rainbow-dress",
    name: "Nimble Rainbow Dress",
    description:
      "A playful cotton dress with rainbow trim and a twirl-worthy skirt. Machine washable, tantrum approved.",
    price: 119900,
    category: "kids",
    sizes: ["2Y", "4Y", "6Y", "8Y"],
    colors: ["Multi"],
    image: img("1596755094514-f87e34085b2c"),
    tags: ["dresses"],
  },
  {
    id: "k3",
    slug: "acorn-knit-cardigan",
    name: "Acorn Knit Cardigan",
    description:
      "A chunky-knit cardigan that keeps little ones cosy without overheating. Buttons sized for small hands.",
    price: 149900,
    compareAtPrice: 189900,
    category: "kids",
    sizes: ["2Y", "4Y", "6Y", "8Y", "10Y"],
    colors: ["Mustard", "Cream"],
    image: img("1519457431-44ccd64a579b"),
    tags: ["sweaters"],
  },
  {
    id: "k4",
    slug: "doodle-mesh-sneaker",
    name: "Doodle Mesh Sneaker",
    description:
      "Feather-light mesh sneakers with easy hook-and-loop straps, so kids can gear up all by themselves.",
    price: 179900,
    category: "kids",
    sizes: ["8K", "9K", "10K", "11K", "12K"],
    colors: ["Pink", "Grey"],
    image: img("1602293589930-45aad59ba3ab"),
    tags: ["shoes"],
    featured: true,
  },
];

export const CATEGORIES: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "kids", label: "Kids" },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: Category | "all"): Product[] {
  if (category === "all") return PRODUCTS;
  return PRODUCTS.filter((p) => p.category === category);
}

/**
 * Fuzzy, clothing-aware search — see src/lib/search.ts.
 * Misspellings ("tshrt", "jens") and synonyms ("tee" → t-shirts) work,
 * and non-clothing queries return nothing instead of random matches.
 */
export function searchProducts(query: string) {
  return fuzzySearch(query);
}

/** Format paise as an INR price string, e.g. 149900 -> "₹1,499" */
export function formatPrice(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
