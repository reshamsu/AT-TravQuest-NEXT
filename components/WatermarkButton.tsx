"use client";

import { useState } from "react";
import { Stamp } from "lucide-react";
import WatermarkTool from "./WatermarkTool";

interface Props {
  imageUrl: string;
  images?: string[];
  fileName?: string;
  className?: string;
}

export default function WatermarkButton({ imageUrl, images, fileName, className }: Props) {
  const [open, setOpen] = useState(false);

  if (!imageUrl) return null;

  return (
    <>
      <button
        type="button"
        title="Add watermark & download"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={
          className ??
          "flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 hover:bg-[#f2836f]/80 text-white text-[11px] font-medium backdrop-blur-sm transition-all duration-200"
        }
      >
        <Stamp size={13} />
        <span>Watermark</span>
      </button>

      {open && (
        <WatermarkTool
          imageUrl={imageUrl}
          images={images}
          fileName={fileName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
