"use client";

import { useState, useRef, useEffect } from "react";
import { Download, X, Stamp, Check } from "lucide-react";

type Position = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

interface Settings {
  logoSrc: string | null;
  position: Position;
  size: number;    // % of image width, 5–50
  opacity: number; // 10–100
  margin: number;  // px at native res, 8–100
  grayscale: boolean;
}

const GRID: { id: Position; symbol: string }[] = [
  { id: "tl", symbol: "↖" }, { id: "tc", symbol: "↑" }, { id: "tr", symbol: "↗" },
  { id: "ml", symbol: "←" }, { id: "mc", symbol: "✕" }, { id: "mr", symbol: "→" },
  { id: "bl", symbol: "↙" }, { id: "bc", symbol: "↓" }, { id: "br", symbol: "↘" },
];

function applyWatermark(
  canvas: HTMLCanvasElement,
  bg: HTMLImageElement,
  logo: HTMLImageElement | null,
  s: Settings,
  w: number,
  h: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(bg, 0, 0, w, h);
  if (!logo || !s.logoSrc) return;

  const logoW = (s.size / 100) * w;
  const logoH = (logo.naturalHeight / logo.naturalWidth) * logoW || logoW;
  const scale = w / (bg.naturalWidth || w);
  const m = s.margin * scale;

  const row = s.position[0]; // t m b
  const col = s.position[1]; // l c r

  const x =
    col === "l" ? m
    : col === "c" ? w / 2 - logoW / 2
    : w - logoW - m;

  const y =
    row === "t" ? m
    : row === "m" ? h / 2 - logoH / 2
    : h - logoH - m;

  ctx.globalAlpha = s.opacity / 100;
  if (s.grayscale) ctx.filter = "grayscale(100%)";
  ctx.drawImage(logo, x, y, logoW, logoH);
  ctx.filter = "none";
  ctx.globalAlpha = 1;
}

function loadImage(src: string, cors = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function WatermarkTool({
  imageUrl,
  images,
  fileName,
  onClose,
}: {
  imageUrl: string;
  images?: string[];
  fileName?: string;
  onClose: () => void;
}) {
  const allImages = images?.length ? images : [imageUrl];
  const initialIdx = Math.max(0, allImages.indexOf(imageUrl));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<Settings>({
    logoSrc: "/favicon.ico",
    position: "br",
    size: 15,
    opacity: 70,
    margin: 30,
    grayscale: false,
  });
  const [previewIdx, setPreviewIdx]     = useState(initialIdx);
  const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(() => new Set([initialIdx]));
  const [bgImg, setBgImg]               = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg]           = useState<HTMLImageElement | null>(null);
  const [tainted, setTainted]           = useState(false);
  const [downloading, setDownloading]   = useState(false);
  const [dlStep, setDlStep]             = useState<{ current: number; total: number } | null>(null);
  const [dlError, setDlError]           = useState("");

  useEffect(() => {
    const src = allImages[previewIdx] ?? imageUrl;
    setTainted(false);
    loadImage(src, true)
      .then(setBgImg)
      .catch(() =>
        loadImage(src, false)
          .then(img => { setBgImg(img); setTainted(true); })
          .catch(() => {})
      );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIdx, images, imageUrl]);

  useEffect(() => {
    if (!settings.logoSrc) { setLogoImg(null); return; }
    loadImage(settings.logoSrc, true)
      .then(setLogoImg)
      .catch(() => setLogoImg(null));
  }, [settings.logoSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bgImg) return;
    const maxW = 640;
    const scale = Math.min(1, maxW / bgImg.naturalWidth);
    applyWatermark(
      canvas, bgImg, logoImg, settings,
      Math.round(bgImg.naturalWidth * scale),
      Math.round(bgImg.naturalHeight * scale),
    );
  }, [bgImg, logoImg, settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev =>
      setSettings(s => ({ ...s, logoSrc: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const toggleImage = (i: number) => {
    setPreviewIdx(i);
    setSelectedIdxs(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIdxs(
      selectedIdxs.size === allImages.length
        ? new Set([previewIdx])
        : new Set(allImages.map((_, i) => i))
    );
  };

  const handleDownload = async () => {
    if (!bgImg || selectedIdxs.size === 0) return;
    setDlError("");
    setDownloading(true);

    const toProcess = [...selectedIdxs].sort((a, b) => a - b);
    setDlStep(toProcess.length > 1 ? { current: 0, total: toProcess.length } : null);

    try {
      for (let j = 0; j < toProcess.length; j++) {
        if (toProcess.length > 1) setDlStep({ current: j + 1, total: toProcess.length });

        const src = allImages[toProcess[j]];
        const img = await loadImage(src, true).catch(() => loadImage(src, false));

        const off = document.createElement("canvas");
        applyWatermark(off, img, logoImg, settings, img.naturalWidth, img.naturalHeight);

        await new Promise<void>((resolve) => {
          off.toBlob(blob => {
            if (!blob) { resolve(); return; }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = toProcess.length > 1
              ? `watermarked-${j + 1}-${fileName ?? "image.jpg"}`
              : `watermarked-${fileName ?? "image.jpg"}`;
            a.click();
            URL.revokeObjectURL(url);
            resolve();
          }, "image/jpeg", 0.93);
        });

        if (j < toProcess.length - 1) {
          await new Promise(r => setTimeout(r, 350));
        }
      }
    } catch {
      setDlError("Download blocked — image host doesn't allow cross-origin export.");
    } finally {
      setDownloading(false);
      setDlStep(null);
    }
  };

  const isUploadActive = !!settings.logoSrc && settings.logoSrc !== "/favicon.ico";
  const allSelected    = selectedIdxs.size === allImages.length;

  const dlLabel = downloading
    ? dlStep ? `Exporting ${dlStep.current}/${dlStep.total}…` : "Exporting…"
    : selectedIdxs.size > 1
      ? `Download ${selectedIdxs.size} Images`
      : "Download Image";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-dk-surface rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 dark:border-dk-stroke shrink-0">
          <div className="flex items-center gap-2">
            <Stamp size={15} className="text-[#f2836f]" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Watermark Editor
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dk-raised transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body — stacks on mobile, side-by-side on md+ */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">

          {/* Canvas preview */}
          <div className="
            relative flex items-center justify-center overflow-auto
            bg-gray-50 dark:bg-dk-base
            p-3 sm:p-6
            shrink-0 md:shrink md:flex-1
            max-h-[42vh] md:max-h-none
            border-b md:border-b-0 border-gray-100 dark:border-dk-stroke
          ">
            {bgImg ? (
              <canvas
                ref={canvasRef}
                className="max-w-full rounded-xl shadow-lg"
                style={{ maxHeight: "calc(42vh - 32px)" }}
              />
            ) : (
              <div className="text-sm text-gray-400">Loading image…</div>
            )}
            {tainted && (
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                Preview only — image host may block download export
              </p>
            )}
          </div>

          {/* Controls panel */}
          <div className="w-full md:w-64 shrink-0 md:border-l border-gray-100 dark:border-dk-stroke flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">

              {/* Logo */}
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                  Logo
                </p>
                <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                  <button
                    onClick={() => setSettings(s => ({ ...s, logoSrc: "/favicon.ico" }))}
                    className={`text-[11px] py-2 rounded-lg border font-medium transition-all ${
                      settings.logoSrc === "/favicon.ico"
                        ? "border-[#f2836f] bg-[#f2836f]/10 text-[#f2836f]"
                        : "border-gray-200 dark:border-dk-stroke text-gray-500 dark:text-gray-400 hover:border-[#f2836f]/40"
                    }`}
                  >
                    Site
                  </button>

                  <label
                    className={`text-[11px] py-2 rounded-lg border font-medium transition-all cursor-pointer text-center ${
                      isUploadActive
                        ? "border-[#f2836f] bg-[#f2836f]/10 text-[#f2836f]"
                        : "border-gray-200 dark:border-dk-stroke text-gray-500 dark:text-gray-400 hover:border-[#f2836f]/40"
                    }`}
                  >
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>

                  <button
                    onClick={() => setSettings(s => ({ ...s, logoSrc: null }))}
                    className={`text-[11px] py-2 rounded-lg border font-medium transition-all ${
                      settings.logoSrc === null
                        ? "border-[#f2836f] bg-[#f2836f]/10 text-[#f2836f]"
                        : "border-gray-200 dark:border-dk-stroke text-gray-500 dark:text-gray-400 hover:border-[#f2836f]/40"
                    }`}
                  >
                    None
                  </button>
                </div>

                {settings.logoSrc && (
                  <div className="h-10 rounded-lg bg-gray-100 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke flex items-center justify-center px-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={settings.logoSrc}
                      alt="logo preview"
                      className="h-7 max-w-full object-contain"
                    />
                  </div>
                )}
              </section>

              {/* Position */}
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                  Position
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {GRID.map(({ id, symbol }) => (
                    <button
                      key={id}
                      onClick={() => setSettings(s => ({ ...s, position: id }))}
                      className={`h-10 sm:h-9 rounded-lg border text-sm transition-all ${
                        settings.position === id
                          ? "border-[#f2836f] bg-[#f2836f]/10 text-[#f2836f]"
                          : "border-gray-200 dark:border-dk-stroke text-gray-400 dark:text-gray-500 hover:border-[#f2836f]/40 hover:text-[#f2836f]"
                      }`}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </section>

              {/* Sliders — 2-col on mobile, single col on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                {(
                  [
                    { key: "size" as const, label: "Logo Size", min: 5, max: 50, unit: "%" },
                    { key: "opacity" as const, label: "Opacity", min: 10, max: 100, unit: "%" },
                    { key: "margin" as const, label: "Margin", min: 8, max: 100, unit: "px" },
                  ] as const
                ).map(({ key, label, min, max, unit }) => (
                  <section key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        {label}
                      </p>
                      <span className="text-[11px] font-medium text-[#f2836f]">
                        {settings[key]}{unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={settings[key]}
                      onChange={e =>
                        setSettings(s => ({ ...s, [key]: +e.target.value }))
                      }
                      className="w-full h-1.5 md:h-1 rounded-full accent-[#f2836f] cursor-pointer"
                    />
                  </section>
                ))}
              </div>

              {/* Grayscale toggle */}
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                  Filter
                </p>
                <button
                  type="button"
                  onClick={() => setSettings(s => ({ ...s, grayscale: !s.grayscale }))}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-[11px] font-medium transition-all ${
                    settings.grayscale
                      ? "border-[#f2836f] bg-[#f2836f]/10 text-[#f2836f]"
                      : "border-gray-200 dark:border-dk-stroke text-gray-500 dark:text-gray-400 hover:border-[#f2836f]/40"
                  }`}
                >
                  <span>Grayscale</span>
                  <span className={`relative inline-block w-8 h-4 rounded-full shrink-0 transition-colors ${settings.grayscale ? "bg-[#f2836f]" : "bg-gray-200 dark:bg-dk-raised"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${settings.grayscale ? "translate-x-4" : "translate-x-0"}`} />
                  </span>
                </button>
              </section>

              {/* Image picker — shown when listing has multiple images */}
              {allImages.length > 1 && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      Images
                      <span className="ml-1 normal-case font-normal text-gray-300">
                        ({selectedIdxs.size}/{allImages.length})
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-[10px] font-semibold text-[#f2836f] hover:underline transition-all"
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                    {allImages.map((src, i) => {
                      const isSelected = selectedIdxs.has(i);
                      const isPreviewing = previewIdx === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleImage(i)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected
                              ? "border-[#f2836f]"
                              : "border-gray-200 dark:border-dk-stroke opacity-50 hover:opacity-75"
                          } ${isPreviewing ? "ring-2 ring-[#f2836f]/30 ring-offset-1" : ""}`}
                          style={{ aspectRatio: "1" }}
                          title={`Image ${i + 1}${isSelected ? " — selected" : " — click to select"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#f2836f] flex items-center justify-center shadow-sm">
                              <Check size={9} className="text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/40 text-white text-[8px] font-medium text-center">
                            {i + 1}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9.5px] text-gray-400 mt-1.5 leading-relaxed">
                    Click to select · preview shown on canvas
                  </p>
                </section>
              )}
            </div>

            {/* Download */}
            <div className="p-4 border-t border-gray-100 dark:border-dk-stroke shrink-0 flex flex-col gap-2">
              {dlError && (
                <p className="text-[10px] text-red-500 text-center leading-relaxed">{dlError}</p>
              )}
              <button
                onClick={handleDownload}
                disabled={downloading || !bgImg || selectedIdxs.size === 0}
                className="btn-primary-sm w-full flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 sm:py-2"
              >
                <Download size={13} />
                {dlLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
