import asyncio
import os
import re
from collections.abc import AsyncIterator
from typing import Protocol

from app.models import Run, Step

PROMPT_PREVIEW_CHARS = 80
ALLOWED_PROVIDERS = ("mock",)


class ExplainProvider(Protocol):
    """Anything that can turn a run into a stream of text chunks.

    A real model provider would implement this same method, so the route never changes.
    """

    def stream(self, run: Run) -> AsyncIterator[str]: ...


def preview_prompt(prompt: str) -> str:
    # Collapse newlines and stray spaces so the preview is one clean line.
    one_line = " ".join(prompt.split())
    if len(one_line) <= PROMPT_PREVIEW_CHARS:
        return one_line
    return one_line[:PROMPT_PREVIEW_CHARS].rstrip() + "…"


def describe_steps(steps: list[Step]) -> str:
    if not steps:
        return "It has no recorded steps."
    names = ", ".join(f"{step.name} ({step.tool})" for step in steps)
    noun = "step" if len(steps) == 1 else "steps"
    return f"It took {len(steps)} {noun}, in order: {names}."


def describe_failure(run: Run) -> str:
    error = run.error
    if error is None:
        return "The run failed, but no error was recorded."
    failed_step = next((step for step in run.steps if step.index == error.step_index), None)
    if failed_step is None:
        # run_0089 has no steps at all but an error pointing at step 3.
        return (
            f"The run failed with a {error.type} error: {error.message}. "
            f"The error points to step {error.step_index}, which was not recorded."
        )
    return f"The run failed at the {failed_step.name} step with a {error.type} error: {error.message}."


def describe_success(run: Run) -> str:
    duration = run.valid_duration_ms
    took = f"in {duration / 1000:.1f} seconds" if duration is not None else "(duration not recorded)"
    tokens = run.input_tokens + run.output_tokens
    # A null cost is unpriced, which is different from a real cost of $0.
    cost = f"cost ${run.cost_usd:.4f}" if run.cost_usd is not None else "cost not recorded"
    return f"The run succeeded {took}, used {tokens} tokens, and its {cost}."


def describe_running(run: Run) -> str:
    current = next((step for step in run.steps if step.status == "running"), None)
    if current is None and run.steps:
        current = run.steps[-1]
    if current is None:
        return "The run is still in progress and no steps have been recorded yet."
    return f"The run is still in progress, currently on the {current.name} step."


def describe_cancellation(run: Run) -> str:
    if not run.steps:
        return "The run was cancelled before any step was recorded."
    return f"The run was cancelled after the {run.steps[-1].name} step."


def describe_outcome(run: Run) -> str:
    if run.status == "succeeded":
        return describe_success(run)
    if run.status == "failed":
        return describe_failure(run)
    if run.status == "running":
        return describe_running(run)
    return describe_cancellation(run)


def build_explanation(run: Run) -> str:
    """The whole explanation, built only from the run's own fields so it is always the same."""
    sentences = [
        f'The {run.agent} agent ran on {run.model} with the prompt "{preview_prompt(run.prompt)}".',
        describe_steps(run.steps),
        describe_outcome(run),
    ]
    if run.warnings:
        sentences.append(f"Note: this run has data warnings: {'; '.join(run.warnings)}.")
    return " ".join(sentences)


class MockExplainProvider:
    def __init__(self, delay_ms: int) -> None:
        self.delay_seconds = delay_ms / 1000

    async def stream(self, run: Run) -> AsyncIterator[str]:
        # Each chunk is one word plus the space after it, so the chunks join back to the exact text.
        for chunk in re.findall(r"\S+\s*", build_explanation(run)):
            yield chunk
            # asyncio.sleep lets other requests run while this one waits; time.sleep would block them all.
            await asyncio.sleep(self.delay_seconds)


def get_provider() -> ExplainProvider:
    name = os.environ.get("EXPLAIN_PROVIDER", "mock")
    if name == "mock":
        return MockExplainProvider(delay_ms=int(os.environ.get("EXPLAIN_MOCK_DELAY_MS", "40")))
    allowed = ", ".join(ALLOWED_PROVIDERS)
    raise ValueError(f"Unknown EXPLAIN_PROVIDER '{name}'. Allowed values: {allowed}")
