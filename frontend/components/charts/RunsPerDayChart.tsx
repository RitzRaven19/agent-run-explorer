"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { VOLUME_COLOR } from "@/components/charts/colors";
import { runsForDayHref } from "@/lib/filters";
import { formatDayLabel } from "@/lib/format";
import type { DayCount } from "@/lib/types";

// The data is fetched by the server page and passed in; this component only draws it and handles clicks.
export default function RunsPerDayChart({ days }: { days: DayCount[] }) {
  const router = useRouter();

  return (
    <BarChart responsive data={days} style={{ width: "100%", height: 260 }}>
      <CartesianGrid vertical={false} stroke="#e2e8f0" />
      <XAxis dataKey="date" tickFormatter={formatDayLabel} tick={{ fontSize: 12 }} />
      <YAxis allowDecimals={false} width={32} tick={{ fontSize: 12 }} />
      <Tooltip labelFormatter={(date) => formatDayLabel(String(date))} />
      <Bar
        dataKey="count"
        name="Runs"
        fill={VOLUME_COLOR}
        cursor="pointer"
        onClick={(_bar, index) => router.push(runsForDayHref(days[index].date))}
      />
    </BarChart>
  );
}
