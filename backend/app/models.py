from datetime import date, timezone
from typing import Literal

from pydantic import AwareDatetime, BaseModel, Field

RunStatus = Literal["succeeded", "failed", "cancelled", "running"]
AgentName = Literal[
    "contract-reviewer",
    "email-drafter",
    "invoice-extractor",
    "kpi-analyst",
    "support-router",
]
ToolName = Literal["llm", "sql", "http", "vector_search", "none"]

# DATA.md says "number", so allow both whole and fractional values.
Number = int | float


class StepTokens(BaseModel):
    input: int
    output: int


class Step(BaseModel):
    index: int
    name: str
    tool: ToolName
    status: RunStatus
    started_at: AwareDatetime
    duration_ms: Number | None
    input: str
    output: str | None
    tokens: StepTokens


class RunError(BaseModel):
    type: str
    message: str
    step_index: int


class RunBase(BaseModel):
    """Fields shared by the full run and the list summary."""

    id: str
    agent: AgentName
    model: str
    status: RunStatus
    started_at: AwareDatetime
    ended_at: AwareDatetime | None
    duration_ms: Number | None
    input_tokens: int
    output_tokens: int
    cost_usd: float | None
    prompt: str
    error: RunError | None
    tenant_id: str
    # Filled in by the loader, never read from the file.
    warnings: list[str] = Field(default_factory=list)

    @property
    def started_day(self) -> date:
        """The UTC calendar day the run started on, the day the dashboard counts it under."""
        return self.started_at.astimezone(timezone.utc).date()

    @property
    def valid_duration_ms(self) -> Number | None:
        """The duration, or None when it is missing or negative (unusable for sorting and stats)."""
        if self.duration_ms is None or self.duration_ms < 0:
            return None
        return self.duration_ms


class Run(RunBase):
    steps: list[Step]

    def to_summary(self) -> "RunSummary":
        return RunSummary(
            **self.model_dump(exclude={"steps"}),
            step_count=len(self.steps),
            has_error=self.error is not None,
        )


class RunSummary(RunBase):
    step_count: int
    has_error: bool


class RunListResponse(BaseModel):
    items: list[RunSummary]
    total: int
    page: int
    page_size: int


class HealthResponse(BaseModel):
    status: Literal["ok"]
    run_count: int
    data_warnings: list[str]


class StatusCounts(BaseModel):
    total: int
    succeeded: int
    failed: int
    cancelled: int
    running: int
    # None when no run has finished yet, so we never divide by zero.
    success_rate: float | None


class AgentStats(StatusCounts):
    agent: AgentName
    # Sum of priced runs only. A null cost is never counted as 0.
    total_cost_usd: float
    priced_count: int
    unpriced_count: int


class DurationStats(BaseModel):
    median_ms: Number | None
    p95_ms: Number | None
    # The fastest and slowest of the same runs, so a client can show where the median and p95 sit between them.
    min_ms: Number | None
    max_ms: Number | None
    completed_count: int


class DayCount(BaseModel):
    date: str
    count: int


class StatsResponse(BaseModel):
    overall: StatusCounts
    per_agent: list[AgentStats]
    duration: DurationStats
    runs_per_day: list[DayCount]
    data_warnings: list[str]
