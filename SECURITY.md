# Security

This is a take-home demo over a fixed, read-only dataset. This page says what protections exist today, what does not, and what I would add before putting real customer data behind it.

## Current posture

**Data and access**
- **No authentication.** Every endpoint is public. That is acceptable only because the data is a static sample file and nothing can be written: there is no endpoint that creates, changes or deletes a run.
- **No secrets in the repo.** The app has none to hold: the mock explain provider needs no API key. `.env.example` lists the variables with no real values, and `.env` files are gitignored.
- **No database**, so there is no SQL injection surface. The data is a Python list loaded from a file at startup.

**Input validation**
- Query parameters are validated by FastAPI and Pydantic. `status`, `agent` and `tool` are `Literal` types, so an unknown value (for example `?tool=hammer`) gets a 422. `page` and `page_size` have bounds (`page_size` at most 100), dates must be real dates, and a reversed date range is a 422.
- The search text `q` is limited to 200 characters (longer gets a 422). Timestamps in the data file must carry a timezone; a line without one is skipped and reported. The stats date range is clipped to the dataset's own days, so a request for year 1 to year 9999 stays cheap.
- The frontend also drops unknown values when it parses the URL (`parseFilters`), so a hand-edited URL cannot send the backend something odd.
- Search is a plain substring match on the prompt, not a regular expression, so a search term cannot cause pathological matching.

**Browser-side**
- **CORS:** the backend allows `http://localhost:3000` plus the exact origins in `CORS_ORIGINS`. There is no wildcard, and only the GET, POST and OPTIONS methods and the Content-Type header are allowed. Only the browser's Explain call needs it; server-side fetches from Next.js are not subject to CORS.
- **Open redirect:** the "Back to runs" link uses `?from=` from the URL. It is parsed and rebuilt (`backToRunsHref`), so only known filters survive and the link always starts with `/runs`. A value like `//evil.com` produces `/runs`. There is a test for this.
- **XSS:** prompts, step inputs/outputs and error messages are untrusted text. React escapes everything it renders, and the code uses no `dangerouslySetInnerHTML` or `innerHTML`. The streamed explanation is rendered as text, never as HTML.

## Known gaps (accepted for the demo)

- **No rate limiting.** Anyone can call any endpoint as often as they like, including the streaming one.
- **No security headers** are set by the app beyond what Vercel and Render add by default (for example no Content-Security-Policy of its own).
- **Backend timeout.** Calls from the Next.js server to the backend give up after 25 seconds, so a sleeping free-tier backend shows a "waking up" message instead of a hung page. There are no retries or circuit breaker.
- **Free hosting.** Render's free tier and the keep-awake ping are a convenience, not a production setup: no SLA, shared resources, and the service restarts from the file on every deploy.
- **Dependencies.** `npm audit` reports high-severity advisories in development dependencies (build and lint tooling, not code shipped to users). I have not force-upgraded them, because that risks breaking the build close to the deadline. `pip` dependencies are pinned in `backend/requirements.txt` but are not scanned automatically.
- **The explain provider is a mock.** If a real model were connected, prompts and step data would be sent to a third party, and prompt-injection from run content would need handling.

## What I would add for production

- **Authentication and authorisation:** SSO (OIDC/SAML) for people, short-lived tokens for services, and role checks on each endpoint, with read access limited to what a role needs.
- **Tenant isolation:** every run would carry a `tenant_id`, and the server (not the client) would add it to every query. Tests would prove one tenant can never read another's runs, including through search and stats.
- **Rate limiting and abuse controls:** per-user and per-IP limits at the gateway, tighter limits and timeouts on the streaming endpoint, and request size limits.
- **Audit logging:** who viewed or explained which run and when, written to append-only storage. Prompts and outputs may contain personal or sensitive data, so access to them should be logged.
- **Secret management:** a secret manager (not plain environment variables) for any provider keys and database credentials, with rotation and no secrets in logs.
- **Dependency and supply-chain scanning:** automated scanning (for example Dependabot and `pip-audit`/`npm audit` in CI) that fails the build on serious findings, plus lockfile review.
- **Hardening:** a Content-Security-Policy and the other standard response headers, HTTPS-only with HSTS, structured logs with sensitive fields redacted, and a data retention policy for run content.

## Reporting a problem

This is a personal take-home project. If you spot a security issue, open an issue on the GitHub repository.
