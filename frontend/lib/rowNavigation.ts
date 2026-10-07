// Which row should get focus after a key press in the runs table? `current` is the focused row's index,
// or -1 when focus is not on any row. Returns null for keys that are not ours, so the browser keeps them.
export function nextRowIndex(current: number, key: string, rowCount: number): number | null {
  if (rowCount === 0) return null;
  const lastRow = rowCount - 1;

  if (key === "ArrowDown") return current < 0 ? 0 : Math.min(current + 1, lastRow);
  if (key === "ArrowUp") return current < 0 ? lastRow : Math.max(current - 1, 0);
  return null;
}
