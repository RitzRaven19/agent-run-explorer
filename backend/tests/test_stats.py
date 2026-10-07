import json

import pytest

from app.data import DEFAULT_DATA_PATH
from app.stats import nearest_rank

# stats_fixture.jsonl has 5 runs:
#   fix_1  kpi-analyst    succeeded  1 Aug  1000 ms   cost 0.5
#   fix_2  kpi-analyst    failed     1 Aug  2000 ms   cost 0.0   (a real price: it failed before any model call)
#   fix_3  kpi-analyst    cancelled  3 Aug  3000 ms   cost null  (unpriced)
#   fix_4  email-drafter  succeeded  3 Aug  10000 ms  cost 0.25
#   fix_5  email-drafter  running    3 Aug  no duration cost 0.1


def get_stats(client, **params) -> dict:
    response = client.get("/api/stats", params=params)
    assert response.status_code == 200
    return response.json()


def test_overall_counts_and_success_rate(fixture_client):
    overall = get_stats(fixture_client)["overall"]

    assert overall["total"] == 5
    assert overall["succeeded"] == 2
    assert overall["failed"] == 1
    assert overall["cancelled"] == 1
    # The running run is counted on its own and is not part of the rate.
    assert overall["running"] == 1
    # success rate = 2 / (2 + 1 + 1) = 0.5   (the running run is not in the denominator)
    assert overall["success_rate"] == 0.5


def test_median_and_p95_use_only_completed_runs(fixture_client):
    duration = get_stats(fixture_client)["duration"]

    # Completed runs are the 4 that are not running: durations [1000, 2000, 3000, 10000].
    assert duration["completed_count"] == 4
    # median of [1000, 2000, 3000, 10000] = (2000 + 3000) / 2 = 2500
    assert duration["median_ms"] == 2500
    # p95 nearest-rank: n = 4, rank = ceil(0.95 * 4) = ceil(3.8) = 4, so the 4th value = 10000
    assert duration["p95_ms"] == 10000


def test_cost_per_agent_ignores_null_and_keeps_zero(fixture_client):
    per_agent = {entry["agent"]: entry for entry in get_stats(fixture_client)["per_agent"]}

    kpi = per_agent["kpi-analyst"]
    # kpi-analyst costs are [0.5, 0.0, null]: total = 0.5 + 0.0 = 0.5 (the null is skipped, not counted as 0)
    assert kpi["total_cost_usd"] == 0.5
    # priced = the 0.5 run and the 0.0 run = 2, unpriced = the null run = 1
    assert kpi["priced_count"] == 2
    assert kpi["unpriced_count"] == 1
    # kpi-analyst success rate = 1 / (1 succeeded + 1 failed + 1 cancelled) = 1/3
    assert kpi["success_rate"] == pytest.approx(1 / 3)

    email = per_agent["email-drafter"]
    # email-drafter costs are [0.25, 0.1]: total = 0.25 + 0.1 = 0.35, nothing unpriced
    assert email["total_cost_usd"] == 0.35
    assert email["priced_count"] == 2
    assert email["unpriced_count"] == 0
    # email-drafter success rate = 1 / (1 succeeded + 0 + 0) = 1.0 (its running run is left out)
    assert email["success_rate"] == 1.0


def test_runs_per_day_fills_the_gap_day_with_zero(fixture_client):
    runs_per_day = get_stats(fixture_client)["runs_per_day"]

    # Runs started on 1 Aug (fix_1, fix_2) and 3 Aug (fix_3, fix_4, fix_5), none on 2 Aug,
    # so the range 1 Aug to 3 Aug has 3 days and the middle one has count 0.
    assert runs_per_day == [
        {"date": "2026-08-01", "count": 2},
        {"date": "2026-08-02", "count": 0},
        {"date": "2026-08-03", "count": 3},
    ]


def test_runs_per_day_uses_the_requested_range(fixture_client):
    runs_per_day = get_stats(fixture_client, started_from="2026-07-31", started_to="2026-08-04")["runs_per_day"]

    # Requested range 31 Jul to 4 Aug is 5 days; only 1 Aug and 3 Aug have runs (2 and 3).
    assert [day["count"] for day in runs_per_day] == [0, 2, 0, 3, 0]


def test_no_runs_and_no_dates_gives_no_days_and_null_stats(fixture_client):
    body = get_stats(fixture_client, q="no prompt contains this text")

    assert body["runs_per_day"] == []
    assert body["overall"]["total"] == 0
    # 0 finished runs means a success rate of 0 / 0, which is reported as null instead of dividing by zero
    assert body["overall"]["success_rate"] is None
    assert body["duration"] == {"median_ms": None, "p95_ms": None, "completed_count": 0}
    assert body["per_agent"] == []


@pytest.mark.parametrize(
    "count, expected_rank",
    [(1, 1), (4, 4), (20, 19), (100, 95)],
)
def test_nearest_rank_picks_the_ceiling_rank(count, expected_rank):
    values = list(range(1, count + 1))

    # With values 1..n the value at rank r is r itself. For n = 20, 0.95 * 20 = 19 exactly, so rank 19, not 20.
    assert nearest_rank(values, 95) == expected_rank


def test_stats_respect_the_same_filters_as_the_list(real_client):
    runs_total = real_client.get("/api/runs", params={"agent": "kpi-analyst"}).json()["total"]

    body = get_stats(real_client, agent="kpi-analyst")

    assert body["overall"]["total"] == runs_total
    assert [entry["agent"] for entry in body["per_agent"]] == ["kpi-analyst"]
    assert body["per_agent"][0]["total"] == runs_total


def test_stats_filters_compose_like_the_list(real_client):
    params = {"status": "failed", "agent": ["kpi-analyst", "email-drafter"], "started_from": "2026-08-01"}
    runs_total = real_client.get("/api/runs", params=params).json()["total"]

    assert get_stats(real_client, **params)["overall"]["total"] == runs_total


def test_stats_reject_the_same_bad_params_as_the_list(real_client):
    assert real_client.get("/api/stats", params={"status": "exploded"}).status_code == 422
    assert real_client.get("/api/stats", params={"agent": "nobody"}).status_code == 422
    bad_range = {"started_from": "2026-08-10", "started_to": "2026-08-01"}
    assert real_client.get("/api/stats", params=bad_range).status_code == 422


def test_real_data_total_and_excluded_negative_duration(real_client):
    body = get_stats(real_client)

    assert body["overall"]["total"] == 200
    assert body["overall"]["running"] == 9
    assert len(body["data_warnings"]) > 0

    # Count completed runs straight from the file: not running and a non-negative duration.
    # run_0031 is on two lines; the later one is the 'running' copy that the app keeps.
    by_id: dict[str, dict] = {}
    with open(DEFAULT_DATA_PATH, encoding="utf-8") as file:
        for line in file:
            record = json.loads(line)
            by_id[record["id"]] = record
    completed = [
        run
        for run in by_id.values()
        if run["status"] != "running" and run["duration_ms"] is not None and run["duration_ms"] >= 0
    ]

    # 200 runs - 9 running - 1 negative duration (run_0064) = 190
    assert len(completed) == 190
    assert body["duration"]["completed_count"] == 190
    assert body["duration"]["p95_ms"] >= body["duration"]["median_ms"] > 0
