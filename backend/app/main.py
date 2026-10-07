import logging
import os
from contextlib import asynccontextmanager
from datetime import date
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app import data
from app.filters import RunFilters, SortField, SortOrder, query_runs
from app.models import AgentName, RunListResponse, RunStatus

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


@app.get("/api/runs", response_model=RunListResponse)
def list_runs(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
    status: Annotated[list[RunStatus] | None, Query()] = None,
    agent: Annotated[list[AgentName] | None, Query()] = None,
    started_from: date | None = None,
    started_to: date | None = None,
    q: str | None = None,
    sort: SortField = "started_at",
    order: SortOrder = "desc",
) -> RunListResponse:
    if started_from and started_to and started_from > started_to:
        raise HTTPException(status_code=422, detail="started_from must not be after started_to")

    filters = RunFilters(
        statuses=status or [],
        agents=agent or [],
        started_from=started_from,
        started_to=started_to,
        search=q,
    )
    page_runs, total = query_runs(data.runs, filters, sort, order, page, page_size)
    return RunListResponse(
        items=[run.to_summary() for run in page_runs],
        total=total,
        page=page,
        page_size=page_size,
    )
