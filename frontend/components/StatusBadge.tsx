import type { RunStatus } from "@/lib/types";

const STATUS_STYLES: Record<RunStatus, string> = {
  succeeded: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-200 text-slate-700",
  running: "bg-blue-100 text-blue-800",
};

export default function StatusBadge({ status }: { status: RunStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}
