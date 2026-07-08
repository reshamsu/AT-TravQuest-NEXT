// components/RichTextEditor.tsx
"use client";

import { useEditor, EditorContent, Extension } from "@tiptap/react";
import { Slice } from "prosemirror-model";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import LinkExtension from "@tiptap/extension-link";
import { useEffect, useRef, useState } from "react";
import {
  TbBold, TbItalic, TbUnderline, TbStrikethrough,
  TbList, TbListNumbers,
  TbAlignLeft, TbAlignCenter, TbAlignRight, TbAlignJustified,
  TbIndentIncrease, TbIndentDecrease,
  TbH1, TbH2, TbH3,
  TbLetterT, TbHighlight,
  TbBlockquote, TbEraser,
  TbLink, TbLinkOff,
} from "react-icons/tb";

// ── FontSize ──────────────────────────────────────────────────────────────────
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.fontSize || null,
          renderHTML: (attrs: Record<string, unknown>) =>
            attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFontSize: (size: string) => ({ chain }: any) =>
        chain().setMark("textStyle", { fontSize: size }).run(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsetFontSize: () => ({ chain }: any) =>
        chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  },
});

// ── LineHeight ────────────────────────────────────────────────────────────────
const LineHeight = Extension.create({
  name: "lineHeight",
  addOptions() { return { types: ["paragraph", "heading"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.lineHeight || null,
          renderHTML: (attrs: Record<string, unknown>) =>
            attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLineHeight: (lh: string) => ({ commands }: any) =>
        (this.options.types as string[]).every((t) =>
          commands.updateAttributes(t, { lineHeight: lh })
        ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsetLineHeight: () => ({ commands }: any) =>
        (this.options.types as string[]).every((t) =>
          commands.resetAttributes(t, "lineHeight")
        ),
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  },
});

// ── Highlight (bg color via TextStyle) ───────────────────────────────────────
const BgColor = Extension.create({
  name: "bgColor",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        backgroundColor: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.backgroundColor || null,
          renderHTML: (attrs: Record<string, unknown>) =>
            attrs.backgroundColor
              ? { style: `background-color: ${attrs.backgroundColor}` }
              : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBgColor: (color: string) => ({ chain }: any) =>
        chain().setMark("textStyle", { backgroundColor: color }).run(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsetBgColor: () => ({ chain }: any) =>
        chain().setMark("textStyle", { backgroundColor: null }).removeEmptyTextStyle().run(),
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  },
});

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT_SIZES = [
  { label: "8",  value: "8pt"  },
  { label: "9",  value: "9pt"  },
  { label: "10", value: "10pt" },
  { label: "11", value: "11pt" },
  { label: "12", value: "12pt" },
  { label: "14", value: "14pt" },
  { label: "16", value: "16pt" },
  { label: "18", value: "18pt" },
  { label: "20", value: "20pt" },
  { label: "24", value: "24pt" },
  { label: "28", value: "28pt" },
  { label: "36", value: "36pt" },
  { label: "48", value: "48pt" },
];

const LINE_HEIGHTS = [
  { label: "Single (1.0)", value: "1.0"  },
  { label: "1.15",         value: "1.15" },
  { label: "1.5",          value: "1.5"  },
  { label: "Double (2.0)", value: "2.0"  },
  { label: "2.5",          value: "2.5"  },
];

const TEXT_COLORS = [
  "#000000", "#1F2937", "#374151", "#6B7280", "#9CA3AF",
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899",
  "#FFFFFF",
];

const HIGHLIGHT_COLORS = [
  "#FEF08A", "#FED7AA", "#BBF7D0", "#BAE6FD",
  "#E9D5FF", "#FECACA", "#D1FAE5", "#FBCFE8",
  "#F3F4F6", "#FFFFFF",
];

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

// ── Toolbar helpers ───────────────────────────────────────────────────────────
function ToolBtn({ active, onClick, title, children }: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-[#00B5A3] text-white"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dk-stroke hover:text-gray-900 dark:hover:text-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-dk-stroke mx-0.5 shrink-0" />;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const [showColorPicker,     setShowColorPicker]     = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showLinkInput,       setShowLinkInput]       = useState(false);
  const [linkUrl,             setLinkUrl]             = useState("");
  const [, forceUpdate] = useState(0);

  const colorRef     = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const linkRef      = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ strike: {} }),
      Placeholder.configure({ placeholder: placeholder ?? "Start typing…" }),
      TextStyle,
      Color,
      FontSize,
      LineHeight,
      BgColor,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: "text-teal-600 underline cursor-pointer", target: "_blank", rel: "noopener noreferrer" } }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onSelectionUpdate: () => forceUpdate((n) => n + 1),
    onTransaction: () => forceUpdate((n) => n + 1),
    editorProps: {
      handleKeyDown(view, event) {
        // Only override Enter when NOT inside a list — lists need Enter to create new items
        if (event.key === "Enter" && !event.shiftKey) {
          const { $from } = view.state.selection;
          const insideList = $from.node(-1)?.type.name === "listItem" || $from.node(-2)?.type.name === "listItem";
          if (insideList) return false; // let Tiptap handle it normally (new list item)
          event.preventDefault();
          view.dispatch(
            view.state.tr
              .replaceSelectionWith(view.state.schema.nodes.hardBreak.create())
              .scrollIntoView()
          );
          return true;
        }
        return false;
      },
      handlePaste(view, event) {
        const html = event.clipboardData?.getData("text/html");
        // If HTML exists, let Tiptap handle it — transformPastedHTML will clean it
        if (html && html.trim()) return false;

        // Plain text fallback — each line becomes its own paragraph
        const text = event.clipboardData?.getData("text/plain");
        if (!text) return false;

        event.preventDefault();
        const { state, dispatch } = view;
        const { schema, tr } = state;

        const lines = text.split(/\r?\n/);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodes: any[] = [];
        for (const raw of lines) {
          const line = raw.replace(/^\t+/, "").trimEnd();
          nodes.push(
            line
              ? schema.nodes.paragraph.create(null, [schema.text(line)])
              : schema.nodes.paragraph.create()
          );
        }
        const slice = new Slice(
          schema.nodes.doc.create(null, nodes).content,
          0,
          0
        );
        dispatch(tr.replaceSelection(slice).scrollIntoView());
        return true;
      },
      transformPastedHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Properties our editor produces — preserve these, strip everything else
        const KEEP_PROPS = new Set([
          "color", "background-color", "font-size", "line-height", "text-align",
        ]);

        doc.querySelectorAll("*").forEach((el) => {
          el.removeAttribute("class");
          el.removeAttribute("color"); // legacy <font color="…"> attribute
          el.removeAttribute("face");
          el.removeAttribute("size");
          // Keep only known-safe CSS properties; strip mso-*, font-family, etc.
          if (el instanceof HTMLElement && el.style.cssText) {
            const kept = el.style.cssText
              .split(";")
              .map((r) => r.trim())
              .filter((rule) => {
                const prop = rule.split(":")[0]?.trim().toLowerCase();
                return prop && KEEP_PROPS.has(prop);
              });
            if (kept.length) {
              el.setAttribute("style", kept.join("; "));
            } else {
              el.removeAttribute("style");
            }
          }
        });

        // Unwrap <font> — legacy element; its attrs are already stripped
        doc.querySelectorAll("font").forEach((el) => {
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
          }
        });

        // Remove Word/Office-specific junk elements
        doc.querySelectorAll("o\\:p").forEach((el) => el.remove());

        return doc.body.innerHTML;
      },
    },
  });

  // Close pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node))
        setShowColorPicker(false);
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node))
        setShowHighlightPicker(false);
      if (linkRef.current && !linkRef.current.contains(e.target as Node))
        setShowLinkInput(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML())
      editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;

  const currentColor      = editor.getAttributes("textStyle").color ?? "#000000";
  const currentBg         = editor.getAttributes("textStyle").backgroundColor ?? "";
  const currentFontSize   = editor.getAttributes("textStyle").fontSize ?? "";
  const currentLineHeight =
    editor.getAttributes("paragraph").lineHeight ??
    editor.getAttributes("heading").lineHeight ?? "";

  const activeHeading = [1, 2, 3].find((l) => editor.isActive("heading", { level: l }));
  const styleValue    = activeHeading ? `h${activeHeading}` : "p";

  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  };

  return (
    <div className="border border-gray-100 dark:border-dk-stroke rounded-xl overflow-hidden focus-within:border-teal-300 dark:focus-within:border-[#00B5A3] focus-within:ring-2 focus-within:ring-teal-100 dark:focus-within:ring-[#00B5A3]/10 bg-white dark:bg-dk-raised shadow-sm transition text-gray-800 dark:text-gray-200">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-dk-surface border-b border-gray-100 dark:border-dk-stroke rounded-t-xl">

        {/* Paragraph style */}
        <select
          value={styleValue}
          onChange={(e) => {
            const v = e.target.value;
            // Collapse selection to just the cursor's anchor position before
            // applying the node-type change, so only the block the cursor is in
            // gets converted — not every block in a multi-block selection.
            const { from } = editor.state.selection;
            const chain = editor.chain().focus().setTextSelection(from);
            if (v === "p") chain.setParagraph().run();
            else chain.setHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
          }}
          className="text-xs bg-white dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 cursor-pointer outline-none hover:border-gray-300 dark:hover:border-gray-600 transition min-w-24"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <Divider />

        {/* Font size */}
        <select
          value={currentFontSize}
          onChange={(e) => {
            const v = e.target.value;
            if (v) (editor.chain().focus() as any).setFontSize(v).run(); // eslint-disable-line @typescript-eslint/no-explicit-any
            else   (editor.chain().focus() as any).unsetFontSize().run(); // eslint-disable-line @typescript-eslint/no-explicit-any
          }}
          className="text-xs bg-white dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 cursor-pointer outline-none hover:border-gray-300 dark:hover:border-gray-600 transition w-16"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <Divider />

        {/* Line height */}
        <select
          value={currentLineHeight}
          onChange={(e) => {
            const v = e.target.value;
            if (v) (editor.chain().focus() as any).setLineHeight(v).run(); // eslint-disable-line @typescript-eslint/no-explicit-any
            else   (editor.chain().focus() as any).unsetLineHeight().run(); // eslint-disable-line @typescript-eslint/no-explicit-any
          }}
          className="text-xs bg-white dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 cursor-pointer outline-none hover:border-gray-300 dark:hover:border-gray-600 transition w-24"
        >
          <option value="">Spacing</option>
          {LINE_HEIGHTS.map((lh) => (
            <option key={lh.value} value={lh.value}>{lh.label}</option>
          ))}
        </select>

        <Divider />

        {/* Bold */}
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
          <TbBold size={15} />
        </ToolBtn>
        {/* Italic */}
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
          <TbItalic size={15} />
        </ToolBtn>
        {/* Underline */}
        <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
          <TbUnderline size={15} />
        </ToolBtn>
        {/* Strikethrough */}
        <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <TbStrikethrough size={15} />
        </ToolBtn>

        <Divider />

        {/* Text color */}
        <div className="relative" ref={colorRef}>
          <button
            type="button"
            title="Text color"
            onClick={() => { setShowColorPicker((p) => !p); setShowHighlightPicker(false); }}
            className="flex flex-col items-center justify-center w-7 h-7 rounded hover:bg-gray-200 dark:hover:bg-dk-stroke transition"
          >
            <TbLetterT size={14} className="text-gray-700 dark:text-gray-300" />
            <span className="w-4 h-1 rounded-sm mt-0.5" style={{ background: currentColor }} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-dk-surface border border-gray-200 dark:border-dk-stroke rounded-xl shadow-xl p-3 w-48">
              <p className="text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wide">Text Color</p>
              <div className="grid grid-cols-7 gap-1.5 mb-3">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }}
                    className="w-5 h-5 rounded border border-gray-200 dark:border-dk-stroke hover:scale-110 transition-transform"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-dk-stroke">
                <label className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Custom</label>
                <input
                  type="color"
                  value={currentColor.startsWith("#") ? currentColor : "#000000"}
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                  className="w-8 h-6 rounded cursor-pointer border border-gray-200 dark:border-dk-stroke p-0.5"
                />
                <button
                  type="button"
                  onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                >Reset</button>
              </div>
            </div>
          )}
        </div>

        {/* Highlight color */}
        <div className="relative" ref={highlightRef}>
          <button
            type="button"
            title="Highlight"
            onClick={() => { setShowHighlightPicker((p) => !p); setShowColorPicker(false); }}
            className="flex flex-col items-center justify-center w-7 h-7 rounded hover:bg-gray-200 dark:hover:bg-dk-stroke transition"
          >
            <TbHighlight size={14} className="text-gray-700 dark:text-gray-300" />
            <span
              className="w-4 h-1 rounded-sm mt-0.5 border border-gray-200 dark:border-dk-stroke"
              style={{ background: currentBg || "#FEF08A" }}
            />
          </button>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-dk-surface border border-gray-200 dark:border-dk-stroke rounded-xl shadow-xl p-3 w-48">
              <p className="text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wide">Highlight</p>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      (editor.chain().focus() as any).setBgColor(color).run(); // eslint-disable-line @typescript-eslint/no-explicit-any
                      setShowHighlightPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-200 dark:border-dk-stroke hover:scale-110 transition-transform"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-dk-stroke">
                <label className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Custom</label>
                <input
                  type="color"
                  value={currentBg.startsWith("#") ? currentBg : "#ffffff"}
                  onChange={(e) => (editor.chain().focus() as any).setBgColor(e.target.value).run()} // eslint-disable-line @typescript-eslint/no-explicit-any
                  className="w-8 h-6 rounded cursor-pointer border border-gray-200 dark:border-dk-stroke p-0.5"
                />
                <button
                  type="button"
                  onClick={() => {
                    (editor.chain().focus() as any).unsetBgColor().run(); // eslint-disable-line @typescript-eslint/no-explicit-any
                    setShowHighlightPicker(false);
                  }}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                >Reset</button>
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* Alignment */}
        <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
          <TbAlignLeft size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center">
          <TbAlignCenter size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
          <TbAlignRight size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify">
          <TbAlignJustified size={15} />
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <TbList size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <TbListNumbers size={15} />
        </ToolBtn>

        <Divider />

        {/* Indent */}
        <ToolBtn active={false} onClick={() => editor.chain().focus().sinkListItem("listItem").run()} title="Increase indent">
          <TbIndentIncrease size={15} />
        </ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().liftListItem("listItem").run()} title="Decrease indent">
          <TbIndentDecrease size={15} />
        </ToolBtn>

        <Divider />

        {/* Heading shortcuts */}
        <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          <TbH1 size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          <TbH2 size={15} />
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          <TbH3 size={15} />
        </ToolBtn>

        <Divider />

        {/* Blockquote */}
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
          <TbBlockquote size={15} />
        </ToolBtn>

        {/* Link */}
        <div className="relative" ref={linkRef}>
          <ToolBtn
            active={editor.isActive("link")}
            onClick={() => {
              setShowLinkInput((p) => !p);
              setLinkUrl(editor.getAttributes("link").href ?? "");
              setShowColorPicker(false);
              setShowHighlightPicker(false);
            }}
            title="Insert link"
          >
            <TbLink size={15} />
          </ToolBtn>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-dk-surface border border-gray-200 dark:border-dk-stroke rounded-xl shadow-xl p-3 w-64">
              <p className="text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wide">Insert Link</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }}
                  placeholder="https://..."
                  autoFocus
                  className="flex-1 text-xs bg-white dark:bg-dk-raised text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-dk-stroke rounded-lg px-2 py-1.5 outline-none focus:border-teal-300 dark:focus:border-[#00B5A3] focus:ring-1 focus:ring-teal-100 dark:focus:ring-[#00B5A3]/10 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={applyLink}
                  className="text-xs bg-teal-500 hover:bg-teal-600 text-white px-2.5 rounded-lg transition"
                >Add</button>
              </div>
            </div>
          )}
        </div>
        {editor.isActive("link") && (
          <ToolBtn
            active={false}
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove link"
          >
            <TbLinkOff size={15} />
          </ToolBtn>
        )}

        <Divider />

        {/* Clear all formatting */}
        <ToolBtn
          active={false}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear formatting"
        >
          <TbEraser size={15} />
        </ToolBtn>

      </div>

      {/* ── Editor area ── */}
      <EditorContent
        editor={editor}
        className={[
          "[&_.tiptap]:px-8 [&_.tiptap]:py-6 [&_.tiptap]:min-h-[260px] [&_.tiptap]:max-h-[800px] [&_.tiptap]:overflow-y-auto [&_.tiptap]:[scrollbar-width:thin] [&_.tiptap]:[scrollbar-color:#d1d5db_transparent] [&_.tiptap]:outline-none",
          "[&_.tiptap]:text-[13.5px] [&_.tiptap]:leading-[1.6]",
          // Paragraphs
          "[&_.tiptap_p]:mt-0 [&_.tiptap_p]:mb-[0.65em] [&_.tiptap_p]:leading-[inherit]",
          // Headings
          "[&_.tiptap_h1]:text-[1.15rem] [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mt-5 [&_.tiptap_h1]:mb-[0.2rem] [&_.tiptap_h1]:leading-snug",
          "[&_.tiptap_h2]:text-[0.975rem] [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mt-4 [&_.tiptap_h2]:mb-[0.2rem] [&_.tiptap_h2]:leading-snug",
          "[&_.tiptap_h3]:text-[0.875rem] [&_.tiptap_h3]:font-bold [&_.tiptap_h3]:mt-3 [&_.tiptap_h3]:mb-[0.15rem] [&_.tiptap_h3]:leading-snug",
          // Inline — let browser bold/italic defaults work; do NOT override color with text-* classes
          "[&_.tiptap_em]:italic",
          "[&_.tiptap_u]:underline [&_.tiptap_u]:underline-offset-2",
          "[&_.tiptap_s]:line-through",
          // Blockquote
          "[&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-teal-300 dark:[&_.tiptap_blockquote]:border-teal-700 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:my-2 [&_.tiptap_blockquote]:text-gray-500 dark:[&_.tiptap_blockquote]:text-gray-400 [&_.tiptap_blockquote]:italic",
          // Links
          "[&_.tiptap_a]:text-teal-600 dark:[&_.tiptap_a]:text-teal-400 [&_.tiptap_a]:underline [&_.tiptap_a]:cursor-pointer",
          // Lists
          "[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:mt-[0.2rem] [&_.tiptap_ul]:mb-[0.2rem]",
          "[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:mt-[0.2rem] [&_.tiptap_ol]:mb-[0.2rem]",
          "[&_.tiptap_li]:leading-[1.6] [&_.tiptap_li]:mb-[0.15rem]",
          "[&_.tiptap_li>p]:mt-0 [&_.tiptap_li>p]:mb-0",
          // Placeholder
          "[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.tiptap_p.is-editor-empty:first-child::before]:text-gray-400 dark:[&_.tiptap_p.is-editor-empty:first-child::before]:text-gray-500",
          "[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.tiptap_p.is-editor-empty:first-child::before]:float-left",
          "[&_.tiptap_p.is-editor-empty:first-child::before]:h-0",
        ].join(" ")}
      />
    </div>
  );
}
