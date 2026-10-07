"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/runs", label: "Runs" },
  { href: "/dashboard", label: "Dashboard" },
];

// currentPath is null before the page's address is known; then no link is marked as the current one.
function NavLinkList({ currentPath }: { currentPath: string | null }) {
  return (
    <div className="flex gap-1.5 text-sm">
      {LINKS.map(({ href, label }) => {
        const isCurrent = currentPath !== null && (currentPath === href || currentPath.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={isCurrent ? "page" : undefined}
            className={`rounded-lg px-3 py-[7px] ${isCurrent ? "bg-[rgba(124,58,237,0.28)] text-white" : "text-muted"}`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

// A run's own page counts as part of Runs, so the section you are in stays highlighted.
export default function NavLinks() {
  return <NavLinkList currentPath={usePathname()} />;
}

// What the layout shows until the address is known, so the links are there from the first paint.
export function NavLinksFallback() {
  return <NavLinkList currentPath={null} />;
}
