"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    // Clear any running timers
    if (startTimerRef.current) clearTimeout(startTimerRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    startTimerRef.current = setTimeout(() => {
      setProgress(0);
      setVisible(true);
    }, 0);

    // Quickly shoot to 80%, then slow crawl
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += current < 60 ? 12 : current < 80 ? 4 : 1;
      if (current >= 90) {
        clearInterval(intervalRef.current!);
        current = 90;
      }
      setProgress(current);
    }, 60);

    // Complete on next tick after paint
    timerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      setTimeout(() => setVisible(false), 300);
    }, 500);

    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-[#f2836f] shadow-[0_0_8px_rgba(242,131,111,0.7)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 0.2s ease-out" : "width 0.06s linear",
        }}
      />
    </div>
  );
}
