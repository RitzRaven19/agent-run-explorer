import type { ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: string;
  // Small text under the value saying what the number does and does not include.
  note?: string;
  // Hover text for the whole tile, for the exact formula.
  title?: string;
  // A thin bar or a badge under the value.
  children?: ReactNode;
};

export default function StatTile({ label, value, note, title, children }: StatTileProps) {
  return (
    <div title={title} className="glass tile flex flex-col gap-2 rounded-2xl p-5">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-4xl font-semibold tracking-[-0.02em] tabular-nums">{value}</span>
      {note && <span className="text-xs text-dim">{note}</span>}
      {children}
    </div>
  );
}
