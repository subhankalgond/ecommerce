import { NextResponse } from "next/server";
import { currentAdmin, canAccess } from "@/lib/admin-users";
import {
  allProducts,
  createProduct,
  updateProduct,
  disableProduct,
  type UpsertInput,
} from "@/lib/product-store";
import { loadStock, adjustStock, saveStock, type StockMap } from "@/lib/orders";
import { reviewSummary } from "@/lib/reviews";

async function authed(): Promise<boolean> {
  return (await currentAdmin()) !== null;
}

async function canManageProducts(): Promise<boolean> {
  const admin = await currentAdmin();
  return admin !== null && canAccess(admin.role, "products");
}

/** GET — all products + stock + ratings for the admin tables */
export async function GET() {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const stock = loadStock();
  const products = allProducts().map((p) => ({
    ...p,
    stock: stock[p.id] ?? null,
    rating: reviewSummary(p.id),
  }));
  return NextResponse.json({ products });
}

/** POST — create a product */
export async function POST(request: Request) {
  if (!(await canManageProducts())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = typeof body.price === "number" ? Math.round(body.price) : 0;
  if (!name || price <= 0) {
    return NextResponse.json({ error: "Name and a positive price are required." }, { status: 400 });
  }
  const category = body.category === "men" || body.category === "women" || body.category === "kids"
    ? body.category
    : "men";

  const input: UpsertInput = {
    name,
    description: typeof body.description === "string" ? body.description.trim() : "",
    price,
    compareAtPrice: typeof body.compareAtPrice === "number" ? Math.round(body.compareAtPrice) : undefined,
    category,
    sizes: Array.isArray(body.sizes) ? (body.sizes as string[]).map(String) : ["M"],
    colors: Array.isArray(body.colors) ? (body.colors as string[]).map(String) : ["Black"],
    images: Array.isArray(body.images) ? (body.images as string[]).map(String).filter(Boolean) : [],
    tags: Array.isArray(body.tags) ? (body.tags as string[]).map(String).map((t) => t.toLowerCase()) : [],
    featured: body.featured === true,
    active: body.active !== false,
    stock: typeof body.stock === "number" ? Math.max(0, Math.round(body.stock)) : undefined,
  };

  const product = createProduct(input);
  if (typeof input.stock === "number") {
    const stock = loadStock();
    stock[product.id] = input.stock;
    saveStock(stock);
  }
  return NextResponse.json({ ok: true, product });
}

/** PATCH — edit product or adjust stock: { id, patch } | { id, stockDelta } | { id, setStock } */
export async function PATCH(request: Request) {
  if (!(await canManageProducts())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  // stock adjustment / history via events
  if (typeof body.stockDelta === "number") {
    const stock: StockMap = adjustStock(id, Math.round(body.stockDelta));
    return NextResponse.json({ ok: true, stock: stock[id] ?? 0 });
  }
  if (typeof body.setStock === "number") {
    const stock = loadStock();
    stock[id] = Math.max(0, Math.round(body.setStock));
    saveStock(stock);
    return NextResponse.json({ ok: true, stock: stock[id] });
  }

  if (typeof body.disable === "boolean") {
    disableProduct(id, body.disable);
    return NextResponse.json({ ok: true });
  }

  const patch = (body.patch ?? {}) as Partial<UpsertInput>;
  const updated = updateProduct(id, patch);
  if (!updated) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ ok: true, product: updated });
}
