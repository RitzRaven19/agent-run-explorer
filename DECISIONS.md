# Decisions

## The four decisions

1. **Null cost.** An agent's total is the sum of its *priced* runs only, and the API returns `priced_count` and `unpriced_count` next to it, so the UI shows "$1.530414 (1 unpriced)". I chose that over treating null as $0, which would hide the gap. The cost is a floor, not the true figure. A real `0.0` stays a real value.
2. **Running runs.** Success rate is `succeeded / (succeeded + failed + cancelled)`. I excluded running runs and count them separately, because they have no outcome yet. The rate moves as runs finish. Sorting by duration or cost puts missing values last in both directions.
3. **Broken records.** The loader never crashes and never silently fixes data. Every problem is logged, listed in `data_warnings` and attached to the run's own `warnings`, which drive a badge in the UI.
   - `run_0031` (duplicate): I kept the consistent "running" copy and dropped the self-contradicting one.
   - `run_0064` (negative duration): I kept the raw value, flagged it and left it out of median and p95.
   - `run_0089` (error points at step 3, no steps): the page says "no steps recorded".
4. **Stats and filters.** `/api/stats` takes the same filters as `/api/runs` and uses the same filter function, so the two cannot disagree. The dashboard calls it with none, so it is always global.

## What I noticed

201 lines but 200 unique runs, plus a negative duration, a run with no steps, 3 unpriced runs, 15 real $0 failures and 9 runs still running. The file isn't sorted, so the default sort is explicit. The full list is in the table below.

## At 20 million runs

I would stop loading a file into memory and use a database (Postgres, or ClickHouse for the analytics) with indexes on `started_at`, `agent` and `status`. Pagination would use a keyset cursor, because deep offsets get slow. Prompt search needs a full-text index. Stats would come from pre-aggregated tables, and validation would move to ingestion so bad records are caught once, at write time.

## With one more day

A Playwright end-to-end test for streaming Explain and keyboard navigation, and a per-status split of runs per day.

## Least happy with

1. A run id that doesn't exist shows the not-found page with HTTP 200, because the loading state streams first. The API itself returns a real 404.
2. The frontend tests only cover pure functions (URL parsing, formatting). I checked the components and streaming Explain by hand.
3. The dashboard is always global even though the API supports filters, so I can't show charts for a filtered list.

My smaller implementation decisions are in [Design decisions](docs/ARCHITECTURE.md#design-decisions).

---

## Data findings

| Run(s) | What is odd | How it is handled |
|---|---|---|
| `run_0031` | Duplicate id, different status; the "succeeded" copy has no end time or duration and a step still "running" | Kept the "running" copy; the dropped copy is in `data_warnings` and on the run's warnings |
| `run_0064` | `duration_ms` is -4000 (ended before it started) | Raw value kept and shown with a warning; excluded from median/p95; sorts last by duration |
| `run_0089` | Error points to step 3, but `steps` is empty | "No steps recorded" plus a warning |
| `run_0008`, `run_0042`, `run_0153` | `cost_usd` is null but tokens are real | Unpriced: shown as "unpriced", never $0; counted in `unpriced_count` |
| 15 runs | `cost_usd` is 0.0; all failed with 0 tokens (failed before any model call) | A real $0, kept as a value |
| 9 runs | Status `running`, no end time or duration | Own count; excluded from success rate, median and p95 |
| `run_0172` | Prompt has leading/trailing whitespace | Shown as is; search ignores surrounding whitespace in the query |
| `run_0121` | Prompt is in French | Shown as is; search is case-insensitive (`casefold`) |
| 14 prompts | Contain newlines (some also emoji/non-ASCII) | Newlines preserved on the detail page |
| File | Not sorted by id or date | Default sort `started_at` desc is explicit; `id` breaks ties |
| File | 201 lines, 200 unique runs | The list says "of 200" |
