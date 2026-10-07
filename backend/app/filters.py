from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Literal

from app.models import AgentName, Number, Run, RunStatus

SortField = Literal["started_at", "duration_ms", "cost_usd"]
SortOrder = Literal["asc", "desc"]


@dataclass
class RunFilters:
    statuses: list[RunStatus] = field(default_factory=list)
    agents: list[AgentName] = field(default_factory=list)
    started_from: date | None = None
    started_to: date | None = None
    search: str | None = None


def filter_runs(runs: list[Run], filters: RunFilters) -> list[Run]:
    """Keep runs that match every filter that is set. An empty filter matches everything."""
    needle = (filters.search or "").strip().casefold()
    matching: list[Run] = []
    for run in runs:
        if filters.statuses and run.status not in filters.statuses:
            continue
        if filters.agents and run.agent not in filters.agents:
            continue
        started_day = run.started_at.astimezone(timezone.utc).date()
        if filters.started_from and started_day < filters.started_from:
            continue
        if filters.started_to and started_day > filters.started_to:
            continue
        if needle and needle not in run.prompt.casefold():
            continue
        matching.append(run)
    return matching


def sort_value(run: Run, sort: SortField) -> datetime | Number | None:
    if sort == "started_at":
        return run.started_at
    if sort == "duration_ms":
        return run.valid_duration_ms
    return run.cost_usd


def sort_runs(runs: list[Run], sort: SortField, order: SortOrder) -> list[Run]:
    """Sort by `sort`; runs with no usable value go last in both directions, ties broken by id."""
    by_id = sorted(runs, key=lambda run: run.id)
    with_value = [run for run in by_id if sort_value(run, sort) is not None]
    without_value = [run for run in by_id if sort_value(run, sort) is None]
    # Python's sort is stable (and keeps equal items in order even with reverse=True),
    # so equal values stay in id order.
    with_value.sort(key=lambda run: sort_value(run, sort), reverse=(order == "desc"))
    return with_value + without_value


def paginate(runs: list[Run], page: int, page_size: int) -> list[Run]:
    start = (page - 1) * page_size
    return runs[start : start + page_size]


def query_runs(
    runs: list[Run],
    filters: RunFilters,
    sort: SortField,
    order: SortOrder,
    page: int,
    page_size: int,
) -> tuple[list[Run], int]:
    """Filter, then sort, then paginate. Returns (this page, total after filtering)."""
    matching = filter_runs(runs, filters)
    page_runs = paginate(sort_runs(matching, sort, order), page, page_size)
    return page_runs, len(matching)
