"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
}

const SIZE_CLASS: Record<string, string> = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-dk-surface w-full sm:rounded-2xl rounded-t-2xl shadow-2xl sm:w-full ${SIZE_CLASS[size]} max-h-[92vh] sm:max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-dk-stroke">
          <h2 className="text-[14px] sm:text-[15px] font-bold text-gray-900 dark:text-gray-100 pr-2 truncate">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-dk-raised hover:text-gray-700 dark:hover:text-gray-200 transition-all shrink-0"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5">{children}</div>
      </div>
    </div>
  );
}
