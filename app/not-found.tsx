import Link from "next/link";
import { TbArrowRight } from "react-icons/tb";

export default function NotFound() {
  return (
    <div
      className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center text-center [background:linear-gradient(135deg,#002822_0%,#0d0d0d_45%,#220e00_100%)]"
    >

      {/* Mobile: soft colour glow; Desktop: subtle radial highlight over the dark gradient */}
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_40%,rgba(0,181,163,0.08)_0%,transparent_60%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 pt-14 px-6">

        <p className="text-sm md:text-base font-extrabold tracking-[0.10em] uppercase text-[#f2836f]">
          TravQuest Travel & Tourism LLC
        </p>

        <h1 className="cursive text-[8rem] md:text-[16rem] font-bold text-white leading-none">
          404
        </h1>

        <div className="w-12 h-[3px] rounded-full bg-[#00B5A3]" />

        <h2 className="text-xl md:text-2xl font-semibold text-white pt-4">
          This Page was Not Found
        </h2>

        <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
          Looks like this page got lost somewhere on the map. Let&apos;s get you back on your journey.
        </p>

        <Link
          href="/"
          className="max-w-fit select-none btn-secondary-base mt-4"
        >
          Back to Home <TbArrowRight size={20} />
        </Link>

      </div>
    </div>
  );
}