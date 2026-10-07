# Decisions

## The four decisions

1. **Null cost.** An agent's total cost is the sum of its *priced* runs only. The API also returns `priced_count` and `unpriced_count`, and the UI shows e.g. "$1.530414 (1 unpriced)". I rejected treating null as $0 because it would understate cost and hide the gap. Trade-off: the total is a floor, not the true figure. A real `0.0` cost stays a real value.
2. **Running runs.** Success rate is `succeeded / (succeeded + failed + cancelled)`. Running runs are excluded and counted separately, because they have no outcome yet. Sorting by duration or cost puts missing values last in both directions, with `id` as the tie-breaker; sorting by `started_at` treats running runs like any other. Trade-off: the rate changes as runs finish.
3. **Broken records.** The loader never crashes and never silently fixes data. It logs each problem, puts it in `data_warnings` (on `/api/health` and `/api/stats`), and gives each affected run its own `warnings`, which drive a badge in the UI. `run_0031` appears twice: I kept the consistent "running" copy and dropped the "succeeded" one, which contradicted itself. `run_0064` has a negative duration: I kept the raw value, flagged it and left it out of median and p95. `run_0089` has an error pointing at step 3 but no steps: the page says "no steps recorded". Unparsable lines are skipped and reported.
4. **Stats and filters.** `/api/stats` accepts the same filters as `/api/runs` and uses the same filter function, so the two can't disagree. The dashboard calls it with no filters, so it is always global. I chose one shared function over a separate "global only" endpoint to keep one definition of "matching runs".

## What I noticed in the data

201 lines but 200 unique runs; a duplicate, a negative duration, a run with no steps, 3 unpriced runs, 15 real $0 failed runs, and 9 still running. The file isn't sorted, so the default sort is explicit. Full list under Details.

## At 20 million runs

I would stop loading a file into memory and use a database (Postgres, or ClickHouse for the analytics), with indexes on `started_at`, `agent` and `status`. Pagination would use a keyset cursor, not offset, because deep offsets get slow. Prompt search needs a full-text index, not a substring scan. Stats would come from pre-aggregated tables or materialised views, with caching, instead of a pass over every row per request. Validation would move to ingestion, so bad records are caught once at write time.

## With one more day

A Playwright end-to-end test for streaming Explain and the keyboard navigation, and a per-status split of runs per day.

## Least happy with

1. A run id that doesn't exist shows the not-found page with HTTP status 200, because the loading state streams first. The API does return a real 404.
2. The frontend tests only cover pure functions (URL filter parsing, formatting). Nothing tests the components or the streaming Explain in a browser; I checked those by hand.
3. The dashboard is always global even though the API supports filters, so you can't see charts for a filtered list.

---

## Details

### Data findings

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

### Smaller decisions

- **URL is the single source of truth** for filters, search, sort and page, so a view can be shared. The page is a server component that reads the URL; no separate client state.
- **`router.replace`, not `push`**, for filter changes, so each keystroke or checkbox doesn't add a Back-button entry. Search is debounced.
- **Suspense `key`** built from the filters, so the loading skeleton shows again when the filters change.
- **Server vs client components:** data is fetched in server components; only things that need the browser are client components that receive plain props: the filter bar, quick investigations, Explain, step expand/collapse, keyboard rows, the request indicator, the table scroll hint, scroll-to-step, the nav links and the error panel. The charts and agent cards are server components.
- **Explain is called from the browser**, straight to the backend. Going through a Next.js server hop could buffer the text and defeat streaming. This is why CORS is needed.
- **`?from=` back link** carries the list's filters to the detail page. It is validated by parsing it and rebuilding the URL, so a value like `//evil.com` can only ever produce `/runs`.
- **Tool filter:** a run matches when *any* of its steps uses one of the chosen tools, and a run with no recorded steps (`run_0089`) matches none. It goes through the same shared filter as everything else, so `/api/stats` respects it too.
- **Request indicator:** the list request is timed on the Next.js server, because that is where the backend call happens. Each request gets an id and the browser counts distinct ids, so React re-running an effect or Back showing an old result can't inflate the count. The agent list is a fixed constant in the frontend (mirroring the backend's `Literal`), so a filter change makes just the one list request. (The counts on the status and agent chips and the header pill come from the unfiltered stats, which the Next.js server keeps for a few minutes.)
- **Keyboard navigation moves real focus** between the run links instead of keeping a separate "selected row" state, so Enter, focus styles and screen readers use what the browser already provides. It ignores keys with modifiers and never acts while focus is in a text field, select or button.
- **Deep link opens the step expanded** by reading the URL fragment with `useSyncExternalStore`, because the server never sees the `#` part. Clicking "Jump to step N" works too, but clicking it again when the hash already matches does nothing, so a step you collapsed by hand stays collapsed.
- **Step numbers start at 0**, matching `index` in the data and `error.step_index`.
- **Median and p95:** median is the middle value (average of the two middle ones when even); p95 uses nearest-rank (the value at rank ceil(0.95 × n)). Both use only non-running runs with a valid, non-negative duration.
- **Charts are plain HTML and CSS**, not a chart library. The three charts are simple bars, so a library would add a dependency for little. Each bar is a real link to the matching runs, with a spoken label, and each chart has a one-sentence summary.
- **Duration bars** in the list are measured against the slowest valid run in the whole dataset (`max_ms` from `/api/stats`, which the Next.js server already keeps for a few minutes), so the same run has the same bar on every page and a filter change still costs one backend call. If the stats are unavailable the list falls back to the slowest run on the page, and the tooltip says so. The dashboard uses `min_ms` and `max_ms` to place the median and p95 on their tile bars.
- **Vitest on pure functions:** URL parsing, the back-link safety check and formatting are where bugs would be silent. A component or end-to-end test would need extra tooling that I judged not worth it in the time.
- **Hardening:** bounded stats range, input limits, id index.
- **Free hosting:** Render (backend) and Vercel (frontend), plus a GitHub Actions ping every 14 minutes to avoid Render's idle sleep. A best-effort workaround, not production practice.
