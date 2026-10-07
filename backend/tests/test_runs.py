import json

import pytest
from fastapi.testclient import TestClient

from app.data import DEFAULT_DATA_PATH
from app.main import app

UNPRICED_IDS = {"run_0008", "run_0042", "run_0153"}


@pytest.fixture(scope="module")
def client():
    # The `with` block runs the app's startup, which loads the data.
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def raw_runs() -> list[dict]:
    """Runs read straight from the file, one per id. Independent of the app's loader."""
    by_id: dict[str, dict] = {}
    with open(DEFAULT_DATA_PATH, encoding="utf-8") as file:
        for line in file:
            record = json.loads(line)
            # run_0031 is on two lines; the later one (line 187, 'running') is the one we keep.
            by_id[record["id"]] = record
    return list(by_id.values())


def get_runs(client: TestClient, **params) -> dict:
    response = client.get("/api/runs", params={"page_size": 100, **params})
    assert response.status_code == 200
    return response.json()


def get_all_items(client: TestClient, **params) -> list[dict]:
    """Walk every page (the API caps page_size at 100) and return all items in order."""
    items: list[dict] = []
    page = 1
    while True:
        body = get_runs(client, page=page, **params)
        items.extend(body["items"])
        if len(items) >= body["total"]:
            return items
        page += 1


def test_filters_compose(client, raw_runs):
    # Compute the expected ids with a plain loop over the file.
    expected_ids = set()
    for run in raw_runs:
        day = run["started_at"][:10]  # timestamps are UTC ('Z'), so the first 10 chars are the UTC date
        if (
            run["agent"] in ("kpi-analyst", "email-drafter")
            and run["status"] == "failed"
            and "2026-08-01" <= day <= "2026-08-15"
        ):
            expected_ids.add(run["id"])
    assert expected_ids, "test data should match at least one run"

    body = get_runs(
        client,
        agent=["kpi-analyst", "email-drafter"],
        status="failed",
        started_from="2026-08-01",
        started_to="2026-08-15",
    )

    assert {item["id"] for item in body["items"]} == expected_ids
    assert body["total"] == len(expected_ids)


def raw_run_uses_tool(run: dict, tools: tuple[str, ...]) -> bool:
    return any(step["tool"] in tools for step in run["steps"])


def test_tool_filter_matches_runs_where_any_step_uses_the_tool(client, raw_runs):
    expected_ids = {run["id"] for run in raw_runs if raw_run_uses_tool(run, ("http",))}
    assert 0 < len(expected_ids) < len(raw_runs), "the filter should neither match nothing nor everything"

    body = get_runs(client, tool="http")

    assert {item["id"] for item in body["items"]} == expected_ids
    assert body["total"] == len(expected_ids)


def test_several_tools_match_runs_using_any_of_them(client, raw_runs):
    expected_ids = {run["id"] for run in raw_runs if raw_run_uses_tool(run, ("http", "sql"))}

    items = get_all_items(client, tool=["http", "sql"])

    assert {item["id"] for item in items} == expected_ids
    assert len(items) == len(expected_ids)


def test_tool_filter_composes_with_agent_and_status(client, raw_runs):
    expected_ids = {
        run["id"]
        for run in raw_runs
        if raw_run_uses_tool(run, ("sql",))
        and run["agent"] in ("kpi-analyst", "email-drafter")
        and run["status"] == "failed"
    }
    assert expected_ids, "test data should match at least one run"

    body = get_runs(client, tool="sql", agent=["kpi-analyst", "email-drafter"], status="failed")

    assert {item["id"] for item in body["items"]} == expected_ids
    assert body["total"] == len(expected_ids)


def test_run_with_no_steps_never_matches_a_tool_filter(client):
    # run_0089 recorded no steps, so it used no tool.
    assert "run_0089" not in {item["id"] for item in get_all_items(client, tool=["llm", "sql", "http", "vector_search", "none"])}


def test_multiple_statuses_return_both_and_nothing_else(client, raw_runs):
    body = get_runs(client, status=["failed", "cancelled"])

    statuses = {item["status"] for item in body["items"]}
    assert statuses == {"failed", "cancelled"}
    assert body["total"] == sum(1 for run in raw_runs if run["status"] in ("failed", "cancelled"))


def test_started_to_covers_the_whole_day(client, raw_runs):
    expected_ids = {run["id"] for run in raw_runs if run["started_at"].startswith("2026-08-21")}

    body = get_runs(client, started_from="2026-08-21", started_to="2026-08-21")

    assert {item["id"] for item in body["items"]} == expected_ids
    assert "run_0172" in expected_ids  # started at 03:28 on that day


def test_search_ignores_case_and_surrounding_whitespace(client):
    # run_0172's prompt is all caps and padded with spaces: '  DRAFT AN APOLOGY + CREDIT OFFER ...  '
    body = get_runs(client, q="  apology + credit  ")

    assert "run_0172" in {item["id"] for item in body["items"]}


def test_blank_search_means_no_search(client):
    assert get_runs(client, q="   ")["total"] == 200


@pytest.mark.parametrize("order", ["asc", "desc"])
def test_cost_sort_puts_unpriced_runs_last(client, order):
    items = get_all_items(client, sort="cost_usd", order=order)

    assert {item["id"] for item in items[-3:]} == UNPRICED_IDS
    assert all(item["cost_usd"] is None for item in items[-3:])
    costs = [item["cost_usd"] for item in items[:-3]]
    assert costs == sorted(costs, reverse=(order == "desc"))


@pytest.mark.parametrize("order", ["asc", "desc"])
def test_duration_sort_puts_running_and_negative_durations_last(client, order):
    items = get_all_items(client, sort="duration_ms", order=order)

    usable = [item for item in items if item["duration_ms"] is not None and item["duration_ms"] >= 0]
    unusable_ids = {item["id"] for item in items[len(usable):]}
    assert "run_0064" in unusable_ids  # duration_ms is -4000
    assert all(item["status"] == "running" for item in items[len(usable):] if item["id"] != "run_0064")
    durations = [item["duration_ms"] for item in usable]
    assert durations == sorted(durations, reverse=(order == "desc"))


def test_pages_do_not_overlap_and_keep_the_same_total(client):
    seen_ids: list[str] = []
    for page in range(1, 8):  # 200 runs at 30 per page is 7 pages
        body = get_runs(client, page=page, page_size=30, sort="cost_usd", order="asc")
        assert body["total"] == 200
        assert body["page"] == page
        seen_ids.extend(item["id"] for item in body["items"])

    assert len(seen_ids) == 200
    assert len(set(seen_ids)) == 200


def test_list_items_never_include_steps(client):
    items = get_runs(client)["items"]

    assert items
    for item in items:
        assert "steps" not in item
        assert "step_count" in item
        assert "has_error" in item


def test_duplicate_id_is_loaded_once_as_the_running_copy(client):
    items = get_all_items(client)
    run_0031 = [item for item in items if item["id"] == "run_0031"]

    assert get_runs(client)["total"] == 200
    assert len(items) == 200
    assert len(run_0031) == 1
    assert run_0031[0]["status"] == "running"


def test_broken_records_carry_warnings(client):
    by_id = {item["id"]: item for item in get_all_items(client)}

    assert any("unpriced" in warning for warning in by_id["run_0008"]["warnings"])
    assert any("invalid duration" in warning for warning in by_id["run_0064"]["warnings"])
    assert any("step 3" in warning for warning in by_id["run_0089"]["warnings"])
    assert any("duplicate id" in warning for warning in by_id["run_0031"]["warnings"])
    assert by_id["run_0089"]["step_count"] == 0
    assert by_id["run_0001"]["warnings"] == []


@pytest.mark.parametrize("path", ["/api/runs", "/api/stats"])
def test_search_text_is_limited_to_200_characters(client, path):
    assert client.get(path, params={"q": "x" * 200}).status_code == 200
    assert client.get(path, params={"q": "x" * 201}).status_code == 422


@pytest.mark.parametrize(
    "params",
    [
        {"page_size": 0},
        {"page_size": 101},
        {"page": 0},
        {"status": "exploded"},
        {"agent": "nobody"},
        {"tool": "hammer"},
        {"sort": "prompt"},
        {"started_from": "2026-08-10", "started_to": "2026-08-01"},
    ],
)
def test_invalid_params_return_422(client, params):
    assert client.get("/api/runs", params=params).status_code == 422
