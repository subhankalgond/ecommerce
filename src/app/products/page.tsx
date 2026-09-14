import { Suspense } from "react";
import Catalog from "./catalog";

export const metadata = {
  title: "Shop all",
  description:
    "Browse clothing for men, women and kids — filter by category, sort by price and more.",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="h-8 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-square animate-pulse rounded-xl bg-neutral-200" />
                <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <Catalog />
    </Suspense>
  );
}
