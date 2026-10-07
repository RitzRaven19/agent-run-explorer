import Link from "next/link";
import { agentCardLabel, agentCostText } from "@/lib/dashboard";
import { runsForAgentHref } from "@/lib/filters";
import { formatPercent } from "@/lib/format";
import type { AgentStats } from "@/lib/types";

// The text inside a card is for the eye; the link's aria-label carries the same facts as one sentence.
function AgentCard({ agent }: { agent: AgentStats }) {
  return (
    <Link
      href={runsForAgentHref(agent.agent)}
      aria-label={agentCardLabel(agent)}
      className="glass tile flex flex-col gap-3 rounded-2xl p-5"
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold text-ink">{agent.agent}</span>
        <span className="text-xs text-dim tabular-nums">
          {agent.total} {agent.total === 1 ? "run" : "runs"}
        </span>
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-xs text-muted">Success rate</span>
        <span className="text-3xl font-semibold tracking-[-0.02em] tabular-nums">{formatPercent(agent.success_rate)}</span>
      </span>
      {agent.success_rate === null ? (
        <span className="h-[5px] rounded bg-white/[0.07]" />
      ) : (
        <span className="h-[5px] overflow-hidden rounded bg-failed/35">
          <span className="block h-full bg-succeeded" style={{ width: `${agent.success_rate * 100}%` }} />
        </span>
      )}
      {agent.running > 0 && <span className="text-xs text-running tabular-nums">{agent.running} running</span>}
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-soft tabular-nums">{agentCostText(agent)}</span>
        {agent.unpriced_count > 0 && (
          <span className="rounded-full border border-warn/25 bg-warn/12 px-2 py-[3px] text-[11px] text-warn">
            {agent.unpriced_count} unpriced
          </span>
        )}
      </span>
      <span className="mt-auto text-[13px] text-accent">Explore runs →</span>
    </Link>
  );
}

export default function AgentCards({ agents }: { agents: AgentStats[] }) {
  return (
    <section aria-labelledby="agents" className="flex flex-col gap-4">
      <h2 id="agents" className="text-lg font-semibold">
        Agents
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
        {agents.map((agent) => (
          <AgentCard key={agent.agent} agent={agent} />
        ))}
      </div>
    </section>
  );
}
