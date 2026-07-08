"use client";

import { TbSun, TbMoon } from "react-icons/tb";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={
        className ??
        "w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-dk-raised border border-gray-200 dark:border-dk-stroke text-gray-500 dark:text-gray-400 hover:border-[#f2836f]/40 hover:text-[#f2836f] hover:bg-[#f2836f]/5 dark:hover:bg-[#f2836f]/10 transition-all duration-200"
      }
    >
      {theme === "dark" ? <TbSun size={16} /> : <TbMoon size={16} />}
    </button>
  );
}
