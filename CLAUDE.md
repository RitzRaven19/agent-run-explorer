# Agent Run Explorer: project conventions

Guidance for AI coding assistants working in this repo. Human-facing docs: README.md, DECISIONS.md, docs/ARCHITECTURE.md, SECURITY.md.

## Authorship
- Commits are authored by Ritu Dey with no Co-Authored-By trailers. AI use is disclosed in README.md under "How AI was used".
- Explain each change before making it; work in small steps.

## Stack
- Backend: Python 3.12 + FastAPI in /backend; data loaded into memory at startup from DATA_PATH; pytest + TestClient.
- Frontend: Next.js App Router + TypeScript in /frontend; Tailwind; plain HTML/CSS charts; Vitest.
- Two separate processes over HTTP; never load data inside Next.js API routes.
- Deploy: backend on Render, frontend on Vercel, GitHub Actions keep-awake ping.

## Code style
- Simple, readable code; no unnecessary libraries or abstractions.
- Clear names, small functions, comments only for the non-obvious "why".
- Type everything (Pydantic models, TypeScript types). No dead code or TODOs.

## Data rules
- Never edit data/runs.jsonl; handle every irregularity in code.
- Never crash on bad data and never silently fix it: record a per-run warning and a global data_warnings entry.
- Unpriced (null) cost is never treated as $0. See DECISIONS.md for the full list of data findings and decisions.

## Commits
- Small commits with clear "area: change" messages. Never commit secrets, .env files, node_modules, .venv or build output. Never rewrite pushed history.
