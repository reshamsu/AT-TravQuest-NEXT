"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold, Italic, Underline, Type, List, ListOrdered, Paintbrush, ChevronDown,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
};

const SIZES = [
  { label: "Small",   value: "2" },
  { label: "Normal",  value: "3" },
  { label: "Large",   value: "5" },
  { label: "Heading", value: "7" },
];

// Prevent toolbar clicks from losing editor focus
function tbDown(e: React.MouseEvent, action: () => void) {
  e.preventDefault();
  action();
}

function TbBtn({
  on, title, onClick, children,
}: { on: boolean; title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => tbDown(e, onClick)}
      className={`p-1.5 rounded-md transition-colors ${
        on
          ? "bg-[#f2836f]/15 text-[#f2836f]"
          : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-dk-stroke hover:text-gray-600 dark:hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  value, onChange, placeholder, rows = 4, className,
}: Props) {
  const editorRef   = useRef<HTMLDivElement>(null);
  const isLocal     = useRef(false);
  const savedPaint  = useRef({ bold: false, italic: false, underline: false, fontSize: "3" });

  const [active,      setActive]      = useState({ bold: false, italic: false, underline: false });
  const [paintMode,   setPaintMode]   = useState(false);
  const [sizeOpen,    setSizeOpen]    = useState(false);
  const [currentSize, setCurrentSize] = useState("3");
  const [hasContent,  setHasContent]  = useState(false);

  // Sync external value into editor (form reset / edit load)
  useEffect(() => {
    if (!editorRef.current || isLocal.current) { isLocal.current = false; return; }
    if (editorRef.current.innerHTML !== (value ?? "")) {
      editorRef.current.innerHTML = value ?? "";
      // Reading textContent right after a manual DOM write (not React-driven)
      // and mirroring it into state; there's no render-time equivalent here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasContent(!!editorRef.current.textContent?.trim());
    }
  }, [value]);

  const refreshActive = useCallback(() => {
    setActive({
      bold:      document.queryCommandState("bold"),
      italic:    document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
    const sz = document.queryCommandValue("fontSize");
    if (sz) setCurrentSize(sz);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActive);
    return () => document.removeEventListener("selectionchange", refreshActive);
  }, [refreshActive]);

  function exec(command: string, val?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    flush();
    refreshActive();
  }

  function flush() {
    const html = editorRef.current?.innerHTML ?? "";
    isLocal.current = true;
    onChange(html);
    setHasContent(!!editorRef.current?.textContent?.trim());
  }

  function handleInput() { flush(); }

  function handleKeyUp() { refreshActive(); }

  // Format painter
  function activatePainter() {
    savedPaint.current = {
      bold:      document.queryCommandState("bold"),
      italic:    document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      fontSize:  document.queryCommandValue("fontSize") || "3",
    };
    setPaintMode(p => !p);
  }

  function handleMouseUp() {
    if (paintMode) {
      const f = savedPaint.current;
      if (f.bold      !== document.queryCommandState("bold"))      document.execCommand("bold");
      if (f.italic    !== document.queryCommandState("italic"))    document.execCommand("italic");
      if (f.underline !== document.queryCommandState("underline")) document.execCommand("underline");
      document.execCommand("fontSize", false, f.fontSize);
      flush();
      setPaintMode(false);
    }
    refreshActive();
  }

  const minH = `${rows * 1.6}rem`;

  return (
    <div
      className={`border border-gray-200 dark:border-dk-stroke rounded-xl overflow-hidden bg-white dark:bg-dk-raised transition-all focus-within:border-[#f2836f] focus-within:shadow-[0_0_0_3px_rgba(26,111,255,0.08)] ${className ?? ""}`}
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 dark:border-dk-stroke bg-gray-50/80 dark:bg-dk-surface/80 flex-wrap">
        <TbBtn on={active.bold}      title="Bold (Ctrl+B)"      onClick={() => exec("bold")}      ><Bold      size={13} /></TbBtn>
        <TbBtn on={active.italic}    title="Italic (Ctrl+I)"    onClick={() => exec("italic")}    ><Italic    size={13} /></TbBtn>
        <TbBtn on={active.underline} title="Underline (Ctrl+U)" onClick={() => exec("underline")} ><Underline size={13} /></TbBtn>

        <div className="w-px h-4 bg-gray-200 dark:bg-dk-stroke mx-1 shrink-0" />

        {/* Font size */}
        <div className="relative">
          <button
            type="button"
            title="Font size"
            onMouseDown={(e) => { e.preventDefault(); setSizeOpen(o => !o); }}
            className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px] font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-dk-stroke hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Type size={12} />
            <span className="w-12 text-left">{SIZES.find(s => s.value === currentSize)?.label ?? "Normal"}</span>
            <ChevronDown size={10} />
          </button>
          {sizeOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-dk-surface border border-gray-200 dark:border-dk-stroke rounded-lg shadow-lg z-50 py-1 min-w-[90px]">
              {SIZES.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec("fontSize", opt.value);
                    setCurrentSize(opt.value);
                    setSizeOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-50 dark:hover:bg-dk-raised transition-colors ${
                    currentSize === opt.value ? "text-[#f2836f] font-semibold" : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-gray-200 dark:bg-dk-stroke mx-1 shrink-0" />

        <TbBtn on={false} title="Bullet list"    onClick={() => exec("insertUnorderedList")} ><List        size={13} /></TbBtn>
        <TbBtn on={false} title="Numbered list"  onClick={() => exec("insertOrderedList")}   ><ListOrdered size={13} /></TbBtn>

        <div className="w-px h-4 bg-gray-200 dark:bg-dk-stroke mx-1 shrink-0" />

        <TbBtn
          on={paintMode}
          title="Format painter — select formatted text to capture, then select target text to apply"
          onClick={activatePainter}
        >
          <Paintbrush size={13} />
        </TbBtn>
      </div>

      {/* ── Editor body ── */}
      <div className="relative">
        {!hasContent && placeholder && (
          <div className="absolute top-0 left-0 right-0 pointer-events-none px-3 py-2.5 text-[13px] text-gray-400 dark:text-gray-500 select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onMouseUp={handleMouseUp}
          onKeyUp={handleKeyUp}
          onKeyDown={(e) => { if (e.key === "Escape") setSizeOpen(false); }}
          className={`rte-body w-full outline-none text-[13px] text-gray-700 dark:text-gray-200 leading-relaxed px-3 py-2.5 ${paintMode ? "cursor-crosshair" : ""}`}
          style={{ minHeight: minH, wordBreak: "break-word" }}
        />
      </div>
    </div>
  );
}
