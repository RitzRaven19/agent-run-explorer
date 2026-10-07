import type { RunStatus } from "@/lib/types";

// Tailwind indigo-500: a plain "how many" colour, kept apart from the four status colours.
export const VOLUME_COLOR = "#6366f1";

// Stronger shades of the StatusBadge hues (green, red, slate, blue), so a status looks the same everywhere.
export const STATUS_COLORS: Record<RunStatus, string> = {
  succeeded: "#16a34a",
  failed: "#dc2626",
  cancelled: "#94a3b8",
  running: "#2563eb",
};
