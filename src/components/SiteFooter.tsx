"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  return (
    <footer
      className={`bg-[#f5f5f5] py-16 text-center text-[15px] text-body ${
        pathname === "/" ? "" : "border-t border-[#f0efed]"
      }`}
    >
      <div className="mx-auto max-w-[1200px] px-5">
        ansem.tips · tip $ansem · the black bull · not financial advice
      </div>
    </footer>
  );
}
