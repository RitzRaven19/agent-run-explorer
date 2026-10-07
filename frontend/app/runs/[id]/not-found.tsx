"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

// not-found.tsx receives no props, so the id is read from the URL with a client hook.
export default function RunNotFound() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-lg font-semibold">
        Run <span className="font-mono">{id}</span> not found
      </h1>
      <p className="mt-2 text-sm text-slate-600">It may have been mistyped, or it is not in the dataset.</p>
      <Link href="/runs" className="mt-4 inline-block text-sm text-blue-700 hover:underline">
        ← Back to runs
      </Link>
    </div>
  );
}
