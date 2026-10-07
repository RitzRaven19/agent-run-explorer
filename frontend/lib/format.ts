import type { RunBase } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PROMPT_PREVIEW_LENGTH = 70;

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

// Built by hand from UTC parts so the server and the browser always print the same text.
export function formatDateTimeUtc(iso: string): string {
  const date = new Date(iso);
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const time = `${twoDigits(date.getUTCHours())}:${twoDigits(date.getUTCMinutes())}`;
  return `${day} ${month} ${date.getUTCFullYear()}, ${time} UTC`;
}

export function formatDurationSeconds(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(1)} s`;
}

// Six decimals because single runs cost fractions of a cent. 0 is a real price and prints as $0.000000.
export function formatCost(costUsd: number): string {
  return `$${costUsd.toFixed(6)}`;
}

// One line: newlines and runs of spaces collapse to a single space before cutting to length.
export function promptPreview(prompt: string): string {
  const oneLine = prompt.replace(/\s+/g, " ").trim();
  if (oneLine.length <= PROMPT_PREVIEW_LENGTH) return oneLine;
  return `${oneLine.slice(0, PROMPT_PREVIEW_LENGTH).trimEnd()}…`;
}

// The backend keeps a negative duration as-is (run_0064) and warns about it, so the UI has to spot it.
export function hasInvalidDuration(run: Pick<RunBase, "duration_ms">): boolean {
  return run.duration_ms !== null && run.duration_ms < 0;
}
