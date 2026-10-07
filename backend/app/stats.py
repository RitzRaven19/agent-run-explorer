import statistics
from datetime import date, timedelta, timezone

from app.models import AgentStats, DayCount, DurationStats, Number, Run, StatusCounts


def success_rate(succeeded: int, failed: int, cancelled: int) -> float | None:
    """succeeded / (succeeded + failed + cancelled). Running runs are not finished, so they are left out."""
    finished = succeeded + failed + cancelled
    if finished == 0:
        return None
    return succeeded / finished


def count_statuses(runs: list[Run]) -> StatusCounts:
    succeeded = sum(1 for run in runs if run.status == "succeeded")
    failed = sum(1 for run in runs if run.status == "failed")
    cancelled = sum(1 for run in runs if run.status == "cancelled")
    running = sum(1 for run in runs if run.status == "running")
    return StatusCounts(
        total=len(runs),
        succeeded=succeeded,
        failed=failed,
        cancelled=cancelled,
        running=running,
        success_rate=success_rate(succeeded, failed, cancelled),
    )


def stats_per_agent(runs: list[Run]) -> list[AgentStats]:
    """One entry per agent that has at least one run, in alphabetical order."""
    stats: list[AgentStats] = []
    for agent in sorted({run.agent for run in runs}):
        agent_runs = [run for run in runs if run.agent == agent]
        # `is not None` matters: a cost of 0.0 is a real price, only null means unpriced.
        costs = [run.cost_usd for run in agent_runs if run.cost_usd is not None]
        stats.append(
            AgentStats(
                **count_statuses(agent_runs).model_dump(),
                agent=agent,
                total_cost_usd=round(sum(costs), 6),
                priced_count=len(costs),
                unpriced_count=len(agent_runs) - len(costs),
            )
        )
    return stats


def nearest_rank(sorted_values: list[Number], percentile: int) -> Number:
    """Nearest-rank percentile: take the value at rank ceil(p/100 * n) in the ascending list.

    The ceiling is done with integers, (p * n + 99) // 100, to avoid float rounding surprises.
    """
    rank = (percentile * len(sorted_values) + 99) // 100
    return sorted_values[rank - 1]


def duration_stats(runs: list[Run]) -> DurationStats:
    """Median, p95, fastest and slowest over completed runs: not running, with a valid (non-negative) duration."""
    durations = sorted(
        run.valid_duration_ms
        for run in runs
        if run.status != "running" and run.valid_duration_ms is not None
    )
    if not durations:
        return DurationStats(median_ms=None, p95_ms=None, min_ms=None, max_ms=None, completed_count=0)
    return DurationStats(
        median_ms=statistics.median(durations),
        p95_ms=nearest_rank(durations, 95),
        min_ms=durations[0],
        max_ms=durations[-1],
        completed_count=len(durations),
    )


def runs_per_day(runs: list[Run], started_from: date | None, started_to: date | None) -> list[DayCount]:
    """Count runs for every UTC day in the range, including days with no runs.

    The range is the requested dates, falling back to the earliest and latest run.
    With no runs and no dates there is no range, so the list is empty.
    """
    counts: dict[date, int] = {}
    for run in runs:
        day = run.started_at.astimezone(timezone.utc).date()
        counts[day] = counts.get(day, 0) + 1

    first = started_from or (min(counts) if counts else None)
    last = started_to or (max(counts) if counts else None)
    if first is None or last is None:
        return []

    days: list[DayCount] = []
    day = first
    while day <= last:
        days.append(DayCount(date=day.isoformat(), count=counts.get(day, 0)))
        day += timedelta(days=1)
    return days
