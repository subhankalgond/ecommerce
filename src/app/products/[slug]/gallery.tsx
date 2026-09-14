"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  image: string;
  alt: string;
  onSale: boolean;
}

/**
 * Derive three visually distinct views from one photo using Unsplash crop
 * parameters (entropy / faces / edges), so the gallery shows multiple
 * "angles" without needing extra uploads.
 */
function variants(src: string): string[] {
  const base = src.split("?")[0];
  return [
    `${base}?q=80&w=900&auto=format&fit=crop&crop=entropy`,
    `${base}?q=80&w=900&auto=format&fit=crop&crop=faces`,
    `${base}?q=80&w=900&auto=format&fit=crop&crop=edges`,
  ];
}

export default function ProductGallery({ image, alt, onSale }: Props) {
  const images = variants(image);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  return (
    <div>
      {/* Main image with hover zoom */}
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-neutral-100"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
        onClick={() => setZoom((z) => !z)}
      >
        <Image
          src={images[active]}
          alt={alt}
          fill
          priority
          unoptimized
          className="object-cover transition-transform duration-200"
          style={{
            transform: zoom ? "scale(2)" : "scale(1)",
            transformOrigin: origin,
          }}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {onSale && (
          <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
            Sale
          </span>
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-neutral-600">
          Hover to zoom 🔍
        </span>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={active === i}
              className={`relative h-20 w-16 overflow-hidden rounded-lg border-2 transition ${
                active === i ? "border-neutral-900" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt="" fill unoptimized className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
