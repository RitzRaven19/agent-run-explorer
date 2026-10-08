import Link from "next/link";
import { agentBarPercent, agentStatusLabel, statusSegments } from "@/lib/dashboard";
import { runsForAgentHref } from "@/lib/filters";
import { STATUS_BAR_COLORS } from "@/lib/statusColors";
import { RUN_STATUSES, type AgentStats } from "@/lib/types";

// One stacked bar per agent: succeeded, failed, cancelled and running as shares of that agent's runs.
export default function AgentStatusChart({ agents }: { agents: AgentStats[] }) {
  return (
    <>
      {agents.map((agent) => (
        <Link
          key={agent.agent}
          href={runsForAgentHref(agent.agent)}
          title={agentStatusLabel(agent)}
          aria-label={agentStatusLabel(agent)}
          className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3 max-md:min-h-10"
        >
          <span className="text-right text-[13px] text-soft">{agent.agent}</span>
          <span className="flex h-[18px] overflow-hidden rounded-md" style={{ width: `${agentBarPercent(agent, agents)}%` }}>
            {statusSegments(agent).map(({ status, percent }) => (
              <span key={status} className="bar block h-full" style={{ width: `${percent}%`, background: STATUS_BAR_COLORS[status] }} />
            ))}
          </span>
        </Link>
      ))}
      <div className="flex flex-wrap gap-4 pl-[142px] text-xs text-muted">
        {RUN_STATUSES.map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: STATUS_BAR_COLORS[status] }} />
            {status}
          </span>
        ))}
      </div>
    </>
  );
}
