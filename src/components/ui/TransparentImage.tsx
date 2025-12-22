import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TransparentImageProps = {
  src: string;
  alt: string;
  className?: string;
};

function toLuma(r: number, g: number, b: number) {
  // Perceived luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isNearGray(r: number, g: number, b: number, tolerance = 12) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min <= tolerance;
}

/**
 * Removes typical solid backgrounds (near-black or near-white/gray) from a bitmap by turning them transparent.
 * This is intentionally simple for this specific hero icon use-case.
 */
export function TransparentImage({ src, alt, className }: TransparentImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const key = useMemo(() => src, [src]);

  useEffect(() => {
    let cancelled = false;

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) return;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];

          const luma = toLuma(r, g, b);

          // Remove near-black backgrounds (common "square" behind the brain)
          if (luma < 18 && isNearGray(r, g, b, 18)) {
            d[i + 3] = 0;
            continue;
          }

          // Remove near-white/gray checkerboard (when exported incorrectly)
          if (luma > 238 && isNearGray(r, g, b, 16)) {
            d[i + 3] = 0;
            continue;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        const out = canvas.toDataURL("image/png");
        if (!cancelled) setDataUrl(out);
      } catch {
        // If anything fails, just keep original src
      }
    };

    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [key, src]);

  return (
    <img
      src={dataUrl ?? src}
      alt={alt}
      className={cn(
        "transition-opacity duration-300",
        dataUrl ? "opacity-100" : "opacity-0",
        className
      )}
      loading="eager"
      decoding="async"
    />
  );
}
