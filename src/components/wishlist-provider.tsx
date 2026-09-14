"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const VISITOR_KEY = "nova-threads-visitor";
const LOCAL_WL = "nova-threads-wishlist";

interface WishlistContextValue {
  ids: string[];
  hydrated: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function getVisitorId(): string {
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Local wishlists work offline; server copy syncs for persistence.
  useEffect(() => {
    try {
      const local = JSON.parse(window.localStorage.getItem(LOCAL_WL) ?? "[]");
      if (Array.isArray(local)) setIds(local as string[]);
    } catch {
      // ignore
    }
    const visitorId = getVisitorId();
    fetch(`/api/wishlist?visitorId=${encodeURIComponent(visitorId)}`)
      .then((r) => r.json())
      .then((d: { productIds?: string[] }) => {
        if (Array.isArray(d.productIds) && d.productIds.length > 0) {
          setIds((prev) => [...new Set([...prev, ...d.productIds!])]);
        }
      })
      .catch(() => {});
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(LOCAL_WL, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, [ids, hydrated]);

  const toggle = useCallback((productId: string) => {
    setIds((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((x) => x !== productId)
        : [...prev, productId];
      const visitorId = getVisitorId();
      fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, productId }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      hydrated,
      has: (id) => ids.includes(id),
      toggle,
      count: ids.length,
    }),
    [ids, hydrated, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
