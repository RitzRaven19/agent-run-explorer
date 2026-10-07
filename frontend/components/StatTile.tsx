import type { ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: string;
  // Shown right next to the value, for something that must not be missed (e.g. unpriced runs).
  aside?: ReactNode;
  // Small text under the value saying what the number does and does not include.
  note: string;
  // Hover text on the value, for the exact formula.
  title?: string;
};

export default function StatTile({ label, value, aside, note, title }: StatTileProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-2">
        <span title={title} className={`text-2xl font-semibold ${title ? "cursor-help" : ""}`}>
          {value}
        </span>
        {aside}
      </p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}
