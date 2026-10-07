import json
from pathlib import Path

from app.data import DEFAULT_DATA_PATH, load_runs


def make_run(run_id: str, **overrides) -> dict:
    """A valid run record, the same shape as the lines of the real data file."""
    record = {
        "id": run_id,
        "agent": "kpi-analyst",
        "model": "test-model",
        "status": "succeeded",
        "started_at": "2026-08-01T10:00:00Z",
        "ended_at": "2026-08-01T10:00:01Z",
        "duration_ms": 1000,
        "input_tokens": 10,
        "output_tokens": 5,
        "cost_usd": 0.5,
        "prompt": "a prompt",
        "error": None,
        "tenant_id": "tenant_1",
        "steps": [],
    }
    return {**record, **overrides}


def write_runs(path: Path, records: list[dict]) -> Path:
    path.write_text("\n".join(json.dumps(record) for record in records) + "\n", encoding="utf-8")
    return path


def test_real_data_still_loads_200_runs_with_6_warnings():
    runs, warnings = load_runs(DEFAULT_DATA_PATH)

    assert len(runs) == 200
    assert len(warnings) == 6


def test_timestamp_without_a_timezone_skips_that_line_and_loads_the_rest(tmp_path):
    path = write_runs(
        tmp_path / "runs.jsonl",
        [make_run("run_a"), make_run("run_b", started_at="2026-08-01T10:00:00"), make_run("run_c")],
    )

    runs, warnings = load_runs(path)

    assert [run.id for run in runs] == ["run_a", "run_c"]
    assert len(warnings) == 1
    assert warnings[0].startswith("line 2: skipped")
    assert "started_at" in warnings[0]


def test_end_time_and_step_time_without_a_timezone_are_also_skipped(tmp_path):
    naive_step = {
        "index": 0, "name": "step", "tool": "llm", "status": "succeeded", "started_at": "2026-08-01T10:00:00",
        "duration_ms": 5, "input": "in", "output": "out", "tokens": {"input": 1, "output": 1},
    }
    path = write_runs(
        tmp_path / "runs.jsonl",
        [make_run("run_a", ended_at="2026-08-01T10:00:01"), make_run("run_b", steps=[naive_step])],
    )

    runs, warnings = load_runs(path)

    assert runs == []
    assert "ended_at" in warnings[0]
    assert "steps.0.started_at" in warnings[1]
