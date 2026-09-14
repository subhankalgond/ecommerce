import fs from "node:fs";
import path from "node:path";
import { PRODUCTS, type Category, type Product } from "@/lib/products";

export type { Category, Product };

/**
 * Admin-managed product catalog, layered on top of the seeded catalog.
 * - Overrides (edits) are stored in .data/product-overrides.json
 * - New products created in the admin go to .data/custom-products.json
 * The in-memory PRODUCTS array stays the source of truth for prices during
 * checkout (parseCart reads PRODUCTS), so admin edits only touch overrides
 * of the SAME field values — the catalog remains the pricing authority.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const OVERRIDES_FILE = path.join(DATA_DIR, "product-overrides.json");
const CUSTOM_FILE = path.join(DATA_DIR, "custom-products.json");

type Override = Partial<Omit<Product, "id" | "slug">> & {
  id: string;
  active?: boolean;
  stock?: number;
};

function readJson<T>(file: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

export function loadOverrides(): Override[] {
  return readJson<Override[]>(OVERRIDES_FILE, []);
}

export function saveOverrides(list: Override[]): void {
  writeJson(OVERRIDES_FILE, list);
}

export function loadCustomProducts(): Product[] {
  return readJson<Product[]>(CUSTOM_FILE, []);
}

export function saveCustomProducts(list: Product[]): void {
  writeJson(CUSTOM_FILE, list);
}

/** All products = seed catalog + admin-created products, with overrides applied */
export function allProducts(): Product[] {
  const overrides = new Map(loadOverrides().map((o) => [o.id, o]));
  const seeded = PRODUCTS.map((p) => {
    const o = overrides.get(p.id);
    return o ? { ...p, ...o, id: p.id } : p;
  });
  const customs = loadCustomProducts().map((p) => {
    const o = overrides.get(p.id);
    return o ? { ...p, ...o, id: p.id } : p;
  });
  return [...seeded, ...customs];
}

export function findProductById(id: string): Product | undefined {
  return allProducts().find((p) => p.id === id);
}

export function findAnyProductBySlug(slug: string): Product | undefined {
  return allProducts().find((p) => p.slug === slug);
}

export interface UpsertInput {
  id?: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: Category;
  sizes: string[];
  colors: string[];
  images: string[];
  tags: string[];
  featured?: boolean;
  active?: boolean;
  stock?: number;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Create a new admin product (custom products live outside the seed list) */
export function createProduct(input: UpsertInput): Product {
  const customs = loadCustomProducts();
  const id = `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  let slug = slugify(input.name) || id;
  while ([...PRODUCTS, ...customs].some((p) => p.slug === slug)) {
    slug = `${slug}-${Math.floor(Math.random() * 90 + 10)}`;
  }
  const product: Product & { active?: boolean; stock?: number } = {
    id,
    slug,
    name: input.name,
    description: input.description,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    category: input.category,
    sizes: input.sizes,
    colors: input.colors,
    image: input.images[0] ?? "",
    tags: input.tags,
    featured: input.featured,
    active: input.active ?? true,
    stock: input.stock,
  };
  customs.push(product);
  saveCustomProducts(customs);
  return product;
}

/** Edit an existing product via the override layer */
export function updateProduct(id: string, patch: Partial<UpsertInput>): Product | undefined {
  const existing = findProductById(id);
  if (!existing) return undefined;
  const overrides = loadOverrides();
  const i = overrides.findIndex((o) => o.id === id);
  const merged: Override = {
    ...(i >= 0 ? overrides[i] : {}),
    ...patch,
    id,
  };
  if (patch.images !== undefined) {
    (merged as { image?: string }).image = patch.images[0] ?? existing.image;
  }
  if (i >= 0) overrides[i] = merged;
  else overrides.push(merged);
  saveOverrides(overrides);
  // custom products: also persist fields that were never in the seed type
  const customs = loadCustomProducts();
  const ci = customs.findIndex((p) => p.id === id);
  if (ci >= 0) {
    customs[ci] = { ...customs[ci], ...patch, image: (merged as { image?: string }).image ?? customs[ci].image } as Product;
    saveCustomProducts(customs);
  }
  return findProductById(id);
}

/** Soft delete: disable the product everywhere (seeded products are never removed) */
export function disableProduct(id: string, disabled: boolean): void {
  const overrides = loadOverrides();
  const i = overrides.findIndex((o) => o.id === id);
  const merged: Override = { ...(i >= 0 ? overrides[i] : {}), id, active: !disabled };
  if (i >= 0) overrides[i] = merged;
  else overrides.push(merged);
  saveOverrides(overrides);
  const customs = loadCustomProducts();
  const ci = customs.findIndex((p) => p.id === id);
  if (ci >= 0) {
    customs[ci] = { ...customs[ci], active: !disabled } as Product;
    saveCustomProducts(customs);
  }
}

/** Whether a product is enabled (defaults to true) */
export function isEnabled(id: string): boolean {
  const o = loadOverrides().find((x) => x.id === id);
  if (o?.active !== undefined) return o.active;
  const customs = loadCustomProducts();
  const c = customs.find((p) => p.id === id) as (Product & { active?: boolean }) | undefined;
  return c?.active ?? true;
}
