from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

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
    started_at: datetime
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
    started_at: datetime
    ended_at: datetime | None
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
