"use client";

import { useEffect } from "react";
import { Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = "Delete this item?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter")  onConfirm();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-dk-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{title}</p>
            <p className="text-[12.5px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-[12px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-dk-raised rounded-xl hover:bg-gray-200 dark:hover:bg-dk-stroke transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
