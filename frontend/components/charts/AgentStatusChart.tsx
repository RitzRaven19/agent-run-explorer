"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { STATUS_COLORS } from "@/components/charts/colors";
import { runsForAgentHref } from "@/lib/filters";
import { formatPercent } from "@/lib/format";
import { RUN_STATUSES, type AgentStats } from "@/lib/types";

export default function AgentStatusChart({ agents }: { agents: AgentStats[] }) {
  const router = useRouter();

  function tooltipTitle(agentName: string): string {
    const agent = agents.find((item) => item.agent === agentName);
    return agent ? `${agentName} · success rate ${formatPercent(agent.success_rate)}` : agentName;
  }

  return (
    // Horizontal, like the cost chart, so every agent name fits on the left even on a phone.
    <BarChart responsive layout="vertical" data={agents} style={{ width: "100%", height: 260 }}>
      <CartesianGrid horizontal={false} stroke="#e2e8f0" />
      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
      <YAxis type="category" dataKey="agent" width={110} tick={{ fontSize: 12 }} />
      <Tooltip labelFormatter={(label) => tooltipTitle(String(label))} />
      <Legend />
      {/* One bar per status, stacked into a single column per agent. */}
      {RUN_STATUSES.map((status) => (
        <Bar
          key={status}
          dataKey={status}
          name={status}
          stackId="status"
          fill={STATUS_COLORS[status]}
          cursor="pointer"
          onClick={(_bar, index) => router.push(runsForAgentHref(agents[index].agent))}
        />
      ))}
    </BarChart>
  );
}
