"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { VOLUME_COLOR } from "@/components/charts/colors";
import { runsForAgentHref } from "@/lib/filters";
import { formatCost, formatPricedTotal } from "@/lib/format";
import type { AgentStats } from "@/lib/types";

// Horizontal bars: agent names fit on the left even on a phone, and each label has room at the bar's end.
export default function AgentCostChart({ agents }: { agents: AgentStats[] }) {
  const router = useRouter();
  const data = agents.map((agent) => ({
    agent: agent.agent,
    cost: agent.total_cost_usd,
    label: formatPricedTotal(agent.total_cost_usd, agent.unpriced_count),
  }));

  return (
    <BarChart responsive layout="vertical" data={data} style={{ width: "100%", height: 260 }}>
      {/* The axis runs to 1.6 × the largest cost, so the longest bar leaves space for its label. */}
      <XAxis type="number" hide domain={[0, (dataMax: number) => dataMax * 1.6]} />
      <YAxis type="category" dataKey="agent" width={110} tick={{ fontSize: 12 }} />
      <Tooltip formatter={(value) => formatCost(Number(value))} />
      <Bar
        dataKey="cost"
        name="Priced cost"
        fill={VOLUME_COLOR}
        cursor="pointer"
        onClick={(_bar, index) => router.push(runsForAgentHref(data[index].agent))}
      >
        <LabelList dataKey="label" position="right" fontSize={12} fill="#334155" />
      </Bar>
    </BarChart>
  );
}
