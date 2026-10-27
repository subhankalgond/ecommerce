import { Suspense } from "react";
import Catalog from "./catalog";

export const metadata = {
  title: "Complete Catalogue — Nova Threads",
  description:
    "Explore thoughtful wardrobe essentials for men, women and kids. Designed with enduring natural fabrics.",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="h-10 w-64 animate-pulse bg-[#ede8df]" />
          <div className="mt-4 h-4 w-96 animate-pulse bg-[#ede8df]" />
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="aspect-[3/4] w-full animate-pulse bg-[#ede8df]" />
                <div className="mt-3 h-3 w-16 animate-pulse bg-[#ede8df]" />
                <div className="mt-2 h-4 w-3/4 animate-pulse bg-[#ede8df]" />
                <div className="mt-2 h-3.5 w-1/3 animate-pulse bg-[#ede8df]" />
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
