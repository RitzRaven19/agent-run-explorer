import logging
import os
from contextlib import asynccontextmanager
from datetime import date
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app import data
from app.filters import RunFilters, SortField, SortOrder, filter_runs, query_runs
from app.models import AgentName, HealthResponse, Run, RunListResponse, RunStatus, StatsResponse
from app.stats import count_statuses, duration_stats, runs_per_day, stats_per_agent

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    data.load_data()
    yield


app = FastAPI(title="Agent Run Explorer API", lifespan=lifespan)

# localhost:3000 is the Next.js dev server; deployed origins come from CORS_ORIGINS.
allowed_origins = ["http://localhost:3000"] + [
    origin.strip() for origin in os.environ.get("CORS_ORIGINS", "").split(",") if origin.strip()
]
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, allow_methods=["*"], allow_headers=["*"])


def get_filters(
    status: Annotated[list[RunStatus] | None, Query()] = None,
    agent: Annotated[list[AgentName] | None, Query()] = None,
    started_from: date | None = None,
    started_to: date | None = None,
    q: str | None = None,
) -> RunFilters:
    """The filter params shared by /api/runs and /api/stats, validated in one place."""
    if started_from and started_to and started_from > started_to:
        raise HTTPException(status_code=422, detail="started_from must not be after started_to")
    return RunFilters(
        statuses=status or [],
        agents=agent or [],
        started_from=started_from,
        started_to=started_to,
        search=q,
    )


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", run_count=len(data.runs), data_warnings=data.data_warnings)


@app.get("/api/runs", response_model=RunListResponse)
def list_runs(
    filters: Annotated[RunFilters, Depends(get_filters)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    sort: SortField = "started_at",
    order: SortOrder = "desc",
) -> RunListResponse:
    page_runs, total = query_runs(data.runs, filters, sort, order, page, page_size)
    return RunListResponse(
        items=[run.to_summary() for run in page_runs],
        total=total,
        page=page,
        page_size=page_size,
    )


@app.get("/api/runs/{run_id}", response_model=Run)
def get_run(run_id: str) -> Run:
    for run in data.runs:
        if run.id == run_id:
            return run
    raise HTTPException(status_code=404, detail=f"Run {run_id} not found")


@app.get("/api/stats", response_model=StatsResponse)
def get_stats(filters: Annotated[RunFilters, Depends(get_filters)]) -> StatsResponse:
    runs = filter_runs(data.runs, filters)
    return StatsResponse(
        overall=count_statuses(runs),
        per_agent=stats_per_agent(runs),
        duration=duration_stats(runs),
        runs_per_day=runs_per_day(runs, filters.started_from, filters.started_to),
        data_warnings=data.data_warnings,
    )
