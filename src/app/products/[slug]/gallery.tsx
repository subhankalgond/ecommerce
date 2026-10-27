"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  image: string;
  alt: string;
  onSale: boolean;
}

function variants(src: string): string[] {
  const base = src.split("?")[0];
  return [
    `${base}?q=80&w=1200&auto=format&fit=crop&crop=entropy`,
    `${base}?q=80&w=1200&auto=format&fit=crop&crop=faces`,
    `${base}?q=80&w=1200&auto=format&fit=crop&crop=edges`,
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
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {/* Thumbnail column */}
      {images.length > 1 && (
        <div className="flex sm:flex-col gap-3 shrink-0">
          {images.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image perspective ${i + 1}`}
              aria-pressed={active === i}
              className={`relative h-20 w-16 sm:h-24 sm:w-18 overflow-hidden border transition ${
                active === i
                  ? "border-[#171614] opacity-100"
                  : "border-[#e5dfd5] opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image with Zoom */}
      <div
        className="relative aspect-[3/4] flex-1 overflow-hidden bg-[#ede8df] cursor-crosshair border border-[#e5dfd5]"
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
          className="object-cover object-center transition-transform duration-200"
          style={{
            transform: zoom ? "scale(2.2)" : "scale(1)",
            transformOrigin: origin,
          }}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {onSale && (
          <span className="absolute left-4 top-4 border border-[#8b5a42] bg-[#faf8f5]/90 px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#8b5a42]">
            Sale Archive
          </span>
        )}

        <span className="absolute bottom-3 right-3 border border-[#ded7ca] bg-[#faf8f5]/85 px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase text-[#544e45]">
          {zoom ? "Click to reset zoom" : "Hover / Click to zoom"}
        </span>
      </div>
    </div>
  );
}
