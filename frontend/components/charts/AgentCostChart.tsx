import Link from "next/link";
import { agentCostLabel, costBarPercent } from "@/lib/dashboard";
import { runsForAgentHref } from "@/lib/filters";
import { formatPricedTotal } from "@/lib/format";
import type { AgentStats } from "@/lib/types";

// Horizontal bars: the agent name on the left, the bar, then the priced total (with its unpriced count) at the bar's end.
export default function AgentCostChart({ agents }: { agents: AgentStats[] }) {
  const highestCost = agents.reduce((highest, agent) => Math.max(highest, agent.total_cost_usd), 0);

  return (
    <>
      {agents.map((agent) => (
        <Link
          key={agent.agent}
          href={runsForAgentHref(agent.agent)}
          aria-label={agentCostLabel(agent)}
          className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3"
        >
          <span className="text-right text-[13px] text-soft">{agent.agent}</span>
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className="bar block h-[22px] rounded-md"
              style={{
                width: `${costBarPercent(agent.total_cost_usd, highestCost)}%`,
                background: "linear-gradient(90deg, rgba(76,29,149,0.5), #a78bfa)",
                boxShadow: "0 0 18px rgba(139,92,246,0.35)",
              }}
            />
            <span className="text-xs whitespace-nowrap text-ink tabular-nums">
              {formatPricedTotal(agent.total_cost_usd, agent.unpriced_count)}
            </span>
          </span>
        </Link>
      ))}
    </>
  );
}
