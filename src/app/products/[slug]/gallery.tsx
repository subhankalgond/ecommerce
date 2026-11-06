"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface Props {
  image: string;
  alt: string;
  onSale: boolean;
}

function variants(src: string): string[] {
  const base = src.split("?")[0];
  return [
    `${base}?q=85&w=1400&auto=format&fit=crop`,
    `${base}?q=85&w=1400&auto=format&fit=crop&crop=entropy`,
    `${base}?q=85&w=1400&auto=format&fit=crop&crop=faces`,
  ];
}

export default function ProductGallery({ image, alt, onSale }: Props) {
  const images = variants(image);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [lightbox, setLightbox] = useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightbox) setLightbox(false);
      if (e.key === "ArrowRight") setActive((cur) => (cur + 1) % images.length);
      if (e.key === "ArrowLeft") setActive((cur) => (cur - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox, images.length]);

  return (
    <>
      <div className="flex flex-col-reverse gap-4 sm:flex-row">
        {/* Thumbnail column */}
        {images.length > 1 && (
          <div className="flex sm:flex-col gap-3 shrink-0">
            {images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View perspective ${i + 1}`}
                aria-pressed={active === i}
                className={`relative h-20 w-16 sm:h-24 sm:w-20 overflow-hidden border transition ${
                  active === i
                    ? "border-[#171614] opacity-100 ring-1 ring-[#171614]"
                    : "border-[#e5dfd5] opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image with Zoom & Fullscreen Trigger */}
        <div
          className="relative aspect-[3/4] flex-1 overflow-hidden bg-[#ede8df] cursor-zoom-in border border-[#e5dfd5]"
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={onMove}
          onClick={() => setLightbox(true)}
        >
          <Image
            src={images[active]}
            alt={alt}
            fill
            priority
            unoptimized
            className="object-cover object-center transition-transform duration-300"
            style={{
              transform: zoom ? "scale(2.2)" : "scale(1)",
              transformOrigin: origin,
            }}
            sizes="(max-width: 1024px) 100vw, 55vw"
          />

          {onSale && (
            <span className="absolute left-4 top-4 border border-[#8b5a42] bg-[#faf8f5]/90 px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#8b5a42]">
              Sale Archive
            </span>
          )}

          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="border border-[#ded7ca] bg-[#faf8f5]/90 px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase text-[#544e45]">
              Click for Fullscreen
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-6 right-6 text-white hover:text-[#d5c7b3] text-sm uppercase tracking-widest border border-white/30 px-3 py-1.5 transition"
          >
            Close ✕
          </button>

          <div className="relative h-[85vh] w-[85vw] max-w-4xl">
            <Image
              src={images[active]}
              alt={alt}
              fill
              unoptimized
              className="object-contain"
            />
          </div>

          <div className="absolute bottom-6 flex gap-3">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`h-2.5 w-8 transition ${
                  active === i ? "bg-white" : "bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
