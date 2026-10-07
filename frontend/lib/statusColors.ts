import type { RunStatus } from "@/lib/types";

// The same hues as StatusBadge, as plain values for dots and inline gradients.
export const STATUS_COLORS: Record<RunStatus, string> = {
  succeeded: "#c4b5fd",
  failed: "#f472b6",
  cancelled: "#8b87a3",
  running: "#818cf8",
};

// In the stacked bars cancelled is darker, so a thin cancelled slice does not blend into the glass behind it.
export const STATUS_BAR_COLORS: Record<RunStatus, string> = { ...STATUS_COLORS, cancelled: "#5b5675" };
