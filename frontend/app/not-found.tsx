import type { Metadata } from "next";
import Link from "next/link";
import PageHeading from "@/components/PageHeading";

export const metadata: Metadata = {
  title: "Page not found",
};

// Any URL that matches no route. An unknown run id has its own, more specific page in app/runs/[id]/not-found.tsx.
export default function NotFound() {
  return (
    <div className="flex flex-col gap-6 pt-14 pb-16">
      <PageHeading eyebrow="404" title="Page not found">
        There is nothing at this address. It may have been mistyped.
      </PageHeading>
      <Link href="/runs" className="outline-button inline-flex items-center self-start">
        ← Back to runs
      </Link>
    </div>
  );
}
