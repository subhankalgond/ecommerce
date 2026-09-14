import { PRODUCTS, type Product } from "@/lib/products";

/**
 * Fuzzy, clothing-aware search.
 *
 * Goals:
 *  - Misspellings still work: "tshrt", "shrt", "jens", "underwar", "sare"
 *  - Synonyms map to catalog tags: tshirt/tee → t-shirts, jeans/denim → jeans,
 *    sweater/jumper → sweaters, saree/sari, lehenga, kurta, underwear, etc.
 *  - Only clothing-ish queries return results — searching "phone" or "laptop"
 *    returns nothing instead of random matches.
 */

/** Words that broaden to the whole catalog */
const EVERYWHERE = new Set([
  "clothing",
  "clothes",
  "cloth",
  "apparel",
  "wear",
  "outfit",
  "fashion",
  "store",
  "shop",
  "all",
]);

/** category words map to the category filter instead of a tag */
const CATEGORY_WORDS: Record<string, Product["category"]> = {
  men: "men",
  mens: "men",
  man: "men",
  boys: "men",
  women: "women",
  womens: "women",
  woman: "women",
  girls: "women",
  lady: "women",
  ladies: "women",
  kid: "kids",
  kids: "kids",
  children: "kids",
  baby: "kids",
};

/** everyday word → catalog tags it should match */
const SYNONYMS: Record<string, string[]> = {
  // t-shirts & shirts
  tshirt: ["t-shirts"],
  tshirts: ["t-shirts"],
  tee: ["t-shirts"],
  tees: ["t-shirts"],
  polo: ["t-shirts", "shirts"],
  polos: ["t-shirts", "shirts"],
  shirt: ["shirts", "t-shirts", "tops"],
  shirts: ["shirts", "t-shirts", "tops"],
  oxford: ["shirts"],
  // jeans / trousers
  jeans: ["jeans"],
  denim: ["jeans", "jackets"],
  trouser: ["jeans"],
  trousers: ["jeans"],
  pants: ["jeans", "shorts"],
  chinos: ["jeans"],
  // jackets & outerwear
  jacket: ["jackets"],
  jackets: ["jackets"],
  hoodie: ["jackets", "sweaters"],
  hoodies: ["jackets", "sweaters"],
  coat: ["jackets"],
  coats: ["jackets"],
  overcoat: ["jackets"],
  overcoats: ["jackets"],
  bomber: ["jackets"],
  blazer: ["jackets", "shirts"],
  shacket: ["jackets", "shirts"],
  // sweaters & knits
  sweater: ["sweaters"],
  sweaters: ["sweaters"],
  cardigan: ["sweaters"],
  cardigans: ["sweaters"],
  jumper: ["sweaters"],
  jumpers: ["sweaters"],
  knitwear: ["sweaters"],
  knit: ["sweaters"],
  cashmere: ["sweaters"],
  // dresses & indianwear
  dress: ["dresses"],
  dresses: ["dresses"],
  frock: ["dresses"],
  frocks: ["dresses"],
  gown: ["dresses"],
  gowns: ["dresses"],
  saree: ["dresses", "tops"],
  sarees: ["dresses", "tops"],
  sari: ["dresses", "tops"],
  saris: ["dresses", "tops"],
  lehenga: ["dresses", "tops"],
  lehengas: ["dresses", "tops"],
  kurta: ["shirts", "tops"],
  kurtas: ["shirts", "tops"],
  kurti: ["tops", "dresses"],
  kurtis: ["tops", "dresses"],
  ethnic: ["dresses", "tops", "shirts"],
  // tops & blouses
  top: ["tops", "t-shirts", "shirts"],
  tops: ["tops", "t-shirts", "shirts"],
  blouse: ["tops"],
  blouses: ["tops"],
  crop: ["tops"],
  tank: ["tops", "t-shirts"],
  // innerwear
  underwear: ["t-shirts", "tops", "shorts"],
  innerwear: ["t-shirts", "tops", "shorts"],
  briefs: ["shorts", "tops"],
  vest: ["t-shirts", "tops"],
  vests: ["t-shirts", "tops"],
  pyjama: ["shorts", "jeans"],
  pajama: ["shorts", "jeans"],
  nightwear: ["dresses", "t-shirts"],
  // bottoms
  shorts: ["shorts"],
  skirt: ["dresses", "tops"],
  skirts: ["dresses", "tops"],
  leggings: ["jeans", "shorts"],
  joggers: ["jeans", "shorts"],
  // footwear & accessories
  shoe: ["shoes"],
  shoes: ["shoes"],
  sneaker: ["shoes"],
  sneakers: ["shoes"],
  footwear: ["shoes"],
  bag: ["accessories"],
  bags: ["accessories"],
  handbag: ["accessories"],
  handbags: ["accessories"],
  purse: ["accessories"],
  wallet: ["accessories"],
  cap: ["accessories"],
  hat: ["accessories"],
  scarf: ["accessories"],
  belt: ["accessories"],
  socks: ["accessories"],
};

let _allTags: Set<string> | null = null;

/** computed lazily so the products↔search import cycle stays safe */
function allTags(): Set<string> {
  if (!_allTags) {
    _allTags = new Set(
      PRODUCTS.flatMap((p) => p.tags.map((t) => t.toLowerCase()))
    );
  }
  return _allTags;
}

/** classic Levenshtein edit distance */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[n];
}

/** how far a misspelling may drift, based on word length */
function maxDistance(len: number): number {
  if (len <= 3) return 0; // exact only for very short words
  if (len <= 5) return 1;
  if (len <= 8) return 2;
  return 3;
}

/** find the closest dictionary key within tolerance, else null */
function fuzzyDict(word: string): string | null {
  const limit = maxDistance(word.length);
  if (limit === 0) return null;
  let best: string | null = null;
  let bestDist = limit + 1;
  for (const key of Object.keys(SYNONYMS)) {
    const d = editDistance(word, key);
    if (d < bestDist) {
      bestDist = d;
      best = key;
    }
  }
  return bestDist <= limit ? best : null;
}

function fuzzyTag(word: string): string | null {
  const limit = maxDistance(word.length);
  if (limit === 0) return null;
  for (const tag of allTags()) {
    if (editDistance(word, tag) <= limit) return tag;
  }
  return null;
}

interface QueryWord {
  raw: string;
  /** catalog tags this word should match, if clothing-related */
  tags: string[] | null;
  /** category filter, if the word names a gender/age group */
  category: Product["category"] | null;
  /** matches the whole catalog */
  everywhere: boolean;
}

function parseQueryWord(raw: string): QueryWord {
  if (EVERYWHERE.has(raw)) {
    return { raw, tags: null, category: null, everywhere: true };
  }
  const category = CATEGORY_WORDS[raw] ?? null;
  if (category) return { raw, tags: null, category, everywhere: false };

  let key = SYNONYMS[raw] ? raw : fuzzyDict(raw);
  if (key) {
    return { raw, tags: SYNONYMS[key], category: null, everywhere: false };
  }
  // not in the synonym dictionary — maybe it's a tag itself ("t-shirts")
  const tag = allTags().has(raw) ? raw : fuzzyTag(raw);
  if (tag) {
    return { raw, tags: [tag], category: null, everywhere: false };
  }
  return { raw, tags: null, category: null, everywhere: false };
}

export interface SearchResult {
  products: Product[];
  /** false when nothing in the query looks like clothing */
  isClothingQuery: boolean;
}

/**
 * Search the catalog with typo tolerance and clothing synonyms.
 * Returns products sorted by match quality, plus whether the query
 * looked like a clothing search at all.
 */
export function searchProducts(query: string): SearchResult {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    return { products: PRODUCTS, isClothingQuery: true };
  }

  const parsed = words.map(parseQueryWord);

  // A word is "clothing-related" if it maps to tags/category/all, or if it
  // textually matches part of a product (names, descriptions, colors, tags).
  let anyClothingWord = parsed.some(
    (w) => w.tags !== null || w.category !== null || w.everywhere
  );

  const scored: { product: Product; score: number }[] = [];

  for (const product of PRODUCTS) {
    const nameWords = product.name.toLowerCase().split(/\s+/);
    const haystack = [
      ...nameWords,
      ...product.tags.map((t) => t.toLowerCase()),
      ...product.colors.map((c) => c.toLowerCase()),
      product.category,
      product.description.toLowerCase(),
    ];
    const colorWords = product.colors.map((c) => c.toLowerCase().split(/\s+/)).flat();

    let score = 0;
    let matched = false;

    for (const word of parsed) {
      if (word.everywhere) {
        score += 1;
        matched = true;
        continue;
      }
      if (word.category) {
        if (product.category === word.category) {
          score += 2;
          matched = true;
        }
        continue;
      }
      if (word.tags) {
        if (word.tags.some((t) => product.tags.includes(t))) {
          score += 3; // strong: synonym/tag hit
          matched = true;
        }
        continue;
      }
      // free word — fuzzy-match it against product text
      const textLimit = maxDistance(word.raw.length);
      const nameHit =
        textLimit > 0 &&
        nameWords.some((nw) => Math.abs(nw.length - word.raw.length) <= 3 && editDistance(word.raw, nw) <= textLimit);
      const tagHit =
        textLimit > 0 &&
        product.tags.some((t) => editDistance(word.raw, t.toLowerCase()) <= textLimit);
      const exactHit =
        haystack.some((h) => h.includes(word.raw)) && word.raw.length >= 3;
      const colorHit = colorWords.some(
        (c) => c.includes(word.raw) || (textLimit > 0 && editDistance(word.raw, c) <= textLimit)
      );

      if (nameHit || tagHit || exactHit) {
        score += 2;
        matched = true;
        anyClothingWord = true; // matches catalog content, so it's a clothing query
      } else if (colorHit) {
        score += 1; // color alone is a weak boost, doesn't qualify a product alone
      }
    }

    if (matched) scored.push({ product, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      Number(b.product.featured ?? false) - Number(a.product.featured ?? false)
  );

  return { products: scored.map((s) => s.product), isClothingQuery: anyClothingWord };
}
