# Project: Agent Run Explorer (Oraczen take-home)

## Context
- Take-home assignment for a Full Stack Engineer internship at Oraczen. The brief is in brief/README.md and brief/DATA.md. The dataset is data/runs.jsonl (201 runs). Never edit or "clean" the dataset; handle every data issue in code.
- HARD DEADLINE: Thursday 8 October 2026, 5:00 PM IST. Finish "Must build" completely before any "Should build" or "Stretch" items.
- Both the backend and the frontend must be DEPLOYED and working together at a live URL, tested in a fresh incognito browser.
- In the follow-up interview, the company will point at any line and ask why it's written that way, what a type is at that point, and what breaks if it's deleted. I (Ritu) must be able to answer for every line.

## Authorship (strict)
- I am the only author. Never add "Co-Authored-By", "Generated with Claude", or any AI attribution to commits, PR descriptions, code comments, README, or any file.
- Commit using the git identity already configured on this machine. Never change git config.

## How to work with me
- Before every action (creating or editing a file, running a command, installing a package, committing), tell me in one or two plain-English sentences WHAT you're about to do and WHY.
- After every change, tell me what changed and which files, in plain English.
- Before running any terminal command, show it and say what it does. I'm on Windows using PowerShell, so give PowerShell-compatible commands.
- Work in small phases (see the plan below). At the end of each phase, STOP, summarise it, and wait for my OK before starting the next.
- If anything in the brief is unclear, or a decision affects how the app behaves, ask me rather than guessing.
- If something fails, explain the error simply, explain the fix, then apply it.

## Code style (so I can explain it)
- Simple, readable code over clever or short code. No unnecessary libraries, abstractions or design patterns.
- Clear names. Small functions that each do one thing.
- Comments only where the WHY isn't obvious; never comments that just restate the code.
- Type everything: Pydantic models in Python, TypeScript types on the frontend.
- No dead code, no unused files, no placeholder TODOs left in the final version.

## Commits (graded by the company)
- Commit after every small working step. Never one huge commit. An "initial commit" with the whole project is an automatic fail.
- Clear messages describing the change, e.g. "backend: add composable status and agent filters to /api/runs".
- Never squash, rebase or rewrite history. Never commit secrets, real .env files, node_modules, .venv or build output.
- Push to origin main at the end of each phase.

## Learning notes (for my interview, never committed)
- Keep INTERVIEW_NOTES.md (gitignored) updated at the end of every phase with:
  1. Each new or changed file and what it does, in one or two lines.
  2. The key decisions and trade-offs made, and why.
  3. 3–5 questions an interviewer might ask about that phase's code, each with a short answer I can say out loud.
  4. Any concept I might not know (e.g. StreamingResponse, server components, URL search params), explained simply.

## Stack (required by the brief)
- Backend: Python + FastAPI in /backend, data loaded into memory at startup from DATA_PATH, pytest + TestClient for tests.
- Frontend: Next.js App Router + TypeScript + React in /frontend, Tailwind for styling, Recharts (or simple SVG) for charts, Vitest for the frontend test.
- Two separate processes over HTTP. Never load data inside Next.js API routes.
- Deploy: backend on Render (free), frontend on Vercel (free), a GitHub Actions keep-awake ping for Render.
- Root .env.example lists every environment variable both services read, with no real values.

## Known data issues (verified)
- run_0031 appears twice (lines 75 and 187) with different status. The "succeeded" copy contradicts itself (no ended_at or duration_ms, and a step still "running"); the "running" copy is consistent.
- run_0064 has duration_ms = -4000 (ended_at before started_at).
- run_0089 has an empty steps array but error.step_index = 3.
- run_0008, run_0042, run_0153 have cost_usd = null. 15 runs have cost_usd = 0.0, which is a real value, not missing.
- 9 runs have status "running", with no ended_at or duration_ms.
- run_0172's prompt has leading/trailing whitespace; run_0121's prompt is French; 14 prompts contain newlines; some contain emoji or non-ASCII.
- The 15 runs with cost_usd = 0.0 are all "failed" with 0 tokens (they failed before any model call), so $0 is a real cost. The 3 null-cost runs have real token counts, so they are genuinely unpriced.
- 201 lines but 200 unique ids after removing the duplicate, so the list total is 200.
- The file is not sorted by id or started_at, so the default sort must be explicit.
- Only "failed" runs have an error object; "cancelled" runs have error = null.
- Every day from 20 Jul to 31 Aug 2026 has at least one run, so zero-filling runs-per-day must be proven with a test fixture.
- The loader must detect these, log a warning for each, expose them as data_warnings in the API, and never silently return wrong data.

## The 4 open decisions in the brief (DECIDED, Phase 1)
Record these in DECISIONS.md in Phase 10.
1. Null cost: an agent's total cost is the sum of its priced runs only. The API also returns priced_count and unpriced_count per agent, and the UI shows e.g. "$1.24 (1 run unpriced)". Null is never treated as 0, and a cost of $0.00 is kept as a real value.
2. Running runs:
   - Success rate = succeeded / (succeeded + failed + cancelled). Running runs are excluded and reported as their own count.
   - Sorting by duration or cost puts nulls last in both directions, with id as the tie-breaker. Sorting by started_at treats running runs like any other.
3. Broken records:
   - Per-run warnings: every run gets a warnings: list[str] field, which drives the UI warning badge. The global data_warnings (from /api/health and /api/stats) lists every issue.
   - run_0031: keep the internally consistent "running" copy (line 187), and record in data_warnings that the "succeeded" copy (line 75) was dropped and why.
   - run_0064: keep the raw duration_ms = -4000 and add a warning. It is excluded from median and p95, and it sorts with the nulls (last) when sorting by duration.
   - run_0089: an empty steps array with step_index = 3 shows "no steps recorded", plus a warning, and never crashes.
   - Unparsable or invalid lines: skip them, log a warning and add them to data_warnings. Startup never crashes.
4. Stats and filters: /api/stats accepts the same filter params as /api/runs and uses the same filter function. With no params it is global, and the dashboard calls it that way.

## Phase plan
1. Read the brief and data, confirm the data issues, propose the 4 decisions, and wait for my choice.
2. Backend: loader and validation, GET /api/runs (pagination, multi-value filters, date range, search, sort, composing filters, no steps in list items) + tests.
3. Backend: GET /api/runs/{id} (404 handling), GET /api/stats, GET /api/health + tests (including one hand-computed statistic on a tiny fixture).
4. Backend: POST /api/runs/{id}/explain, streamed, with a mock provider selected by EXPLAIN_PROVIDER, deterministic text and a small delay, working with no API key + test.
5. Deploy the backend to Render and verify with curl.
6. Frontend: /runs, server-rendered, all state in URL search params, debounced search, visible loading, empty and error states.
7. Frontend: /runs/[id] with metadata, error, readable steps, and the streaming "Explain this run".
8. Frontend: /dashboard with 2–3 charts and stat tiles, plus one Vitest test.
9. Deploy the frontend to Vercel, connect it to the backend, test in incognito.
10. README.md (clean-machine setup), DECISIONS.md, .env.example, and a final fresh-clone test.
11. Only if there's time: tool filter, deep-link to a step, request indicator, keyboard navigation.
