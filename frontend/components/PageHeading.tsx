import type { ReactNode } from "react";

// The big gradient title with the small label above it that every page starts with.
export default function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2.5">
      <span className="text-xs uppercase tracking-[0.14em] text-muted">{eyebrow}</span>
      <h1 className="bg-linear-to-b from-white from-20% to-[#a78bfa] bg-clip-text text-[44px] leading-[1.1] font-semibold tracking-[-0.03em] text-transparent">
        {title}
      </h1>
      {children && <p className="max-w-[560px] text-[15px] text-muted">{children}</p>}
    </div>
  );
}
