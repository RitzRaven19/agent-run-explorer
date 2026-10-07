// These types mirror backend/app/models.py. If a field changes there, change it here too.
// Datetimes arrive as ISO strings because JSON has no date type.

export const RUN_STATUSES = ["succeeded", "failed", "cancelled", "running"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const AGENT_NAMES = [
  "contract-reviewer",
  "email-drafter",
  "invoice-extractor",
  "kpi-analyst",
  "support-router",
] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export const TOOL_NAMES = ["llm", "sql", "http", "vector_search", "none"] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export const SORT_FIELDS = ["started_at", "duration_ms", "cost_usd"] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_ORDERS = ["asc", "desc"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export type StepTokens = {
  input: number;
  output: number;
};

export type Step = {
  index: number;
  name: string;
  tool: ToolName;
  status: RunStatus;
  started_at: string;
  duration_ms: number | null;
  input: string;
  output: string | null;
  tokens: StepTokens;
};

export type RunError = {
  type: string;
  message: string;
  step_index: number;
};

// Fields shared by the full run and the list summary.
export type RunBase = {
  id: string;
  agent: AgentName;
  model: string;
  status: RunStatus;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number | null;
  prompt: string;
  error: RunError | null;
  tenant_id: string;
  warnings: string[];
};

export type Run = RunBase & {
  steps: Step[];
};

export type RunSummary = RunBase & {
  step_count: number;
  has_error: boolean;
};

export type RunListResponse = {
  items: RunSummary[];
  total: number;
  page: number;
  page_size: number;
};

export type StatusCounts = {
  total: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  running: number;
  success_rate: number | null;
};

export type AgentStats = StatusCounts & {
  agent: AgentName;
  total_cost_usd: number;
  priced_count: number;
  unpriced_count: number;
};

export type DurationStats = {
  median_ms: number | null;
  p95_ms: number | null;
  // The fastest and slowest of the same runs; they place the median and p95 on the dashboard's tile bars.
  min_ms: number | null;
  max_ms: number | null;
  completed_count: number;
};

export type DayCount = {
  date: string;
  count: number;
};

export type StatsResponse = {
  overall: StatusCounts;
  per_agent: AgentStats[];
  duration: DurationStats;
  runs_per_day: DayCount[];
  data_warnings: string[];
};
