import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const WISHLIST_FILE = path.join(DATA_DIR, "wishlists.json");

/**
 * Wishlists keyed by a client-generated visitor id (cookie/localStorage),
 * so guests get wishlist functionality without accounts.
 */
export type WishlistMap = Record<string, string[]>;

function load(): WishlistMap {
  try {
    const raw = fs.readFileSync(WISHLIST_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as WishlistMap) : {};
  } catch {
    return {};
  }
}

function save(map: WishlistMap): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(WISHLIST_FILE, JSON.stringify(map, null, 2), "utf8");
}

export function getWishlist(visitorId: string): string[] {
  return load()[visitorId] ?? [];
}

export function toggleWishlist(visitorId: string, productId: string): string[] {
  const map = load();
  const list = new Set(map[visitorId] ?? []);
  if (list.has(productId)) list.delete(productId);
  else list.add(productId);
  map[visitorId] = [...list];
  save(map);
  return map[visitorId];
}

export function removeFromWishlist(visitorId: string, productId: string): string[] {
  const map = load();
  map[visitorId] = (map[visitorId] ?? []).filter((id) => id !== productId);
  save(map);
  return map[visitorId];
}
