"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import WatermarkButton from "../WatermarkButton";

export default function ImageSlider({
  images,
  className,
  fileName,
}: {
  images: string[];
  className?: string;
  fileName?: string;
}) {
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (!images.length) return null;

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { if (diff > 0) next(); else prev(); }
    touchStartX.current = null;
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-gray-100 select-none ${className ?? ""}`}
      style={{ aspectRatio: "16/9" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + i}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
      ))}

      {/* Watermark button — always visible on current image */}
      <div className="absolute top-2 left-2 z-10">
        <WatermarkButton imageUrl={images[idx]} images={images} fileName={fileName} />
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all"
          >
            <ChevronRight size={14} />
          </button>

          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === idx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>

          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/40 rounded-full text-[10px] text-white font-medium tabular-nums">
            {idx + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
