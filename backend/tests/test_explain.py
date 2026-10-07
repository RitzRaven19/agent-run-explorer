import asyncio

import pytest
from fastapi.testclient import TestClient

from app.explain import MockExplainProvider, get_provider
from app.main import app
from app.models import Run


@pytest.fixture(autouse=True)
def no_mock_delay(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("EXPLAIN_MOCK_DELAY_MS", "0")
    monkeypatch.delenv("EXPLAIN_PROVIDER", raising=False)


def explain(client, run_id: str) -> str:
    response = client.post(f"/api/runs/{run_id}/explain")
    assert response.status_code == 200
    return response.text


def test_stream_response_has_text_body_and_no_buffering_headers(real_client):
    with real_client.stream("POST", "/api/runs/run_0042/explain") as response:
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/plain; charset=utf-8"
        assert response.headers["cache-control"] == "no-cache"
        assert response.headers["x-accel-buffering"] == "no"
        text = "".join(response.iter_text())

    assert text.strip() != ""


# TestClient gathers the whole body before returning it, so it cannot show chunk-by-chunk delivery.
# The chunks are checked where they are made, on the provider's async generator.
def test_provider_streams_the_text_in_many_chunks(real_client):
    run = Run.model_validate(real_client.get("/api/runs/run_0042").json())

    async def collect() -> list[str]:
        return [chunk async for chunk in MockExplainProvider(delay_ms=0).stream(run)]

    chunks = asyncio.run(collect())

    assert len(chunks) > 20
    assert "".join(chunks) == explain(real_client, "run_0042")


def test_same_run_gives_exactly_the_same_text(real_client):
    assert explain(real_client, "run_0042") == explain(real_client, "run_0042")


def test_failed_run_mentions_error_type_and_failed_step(fixture_client):
    text = explain(fixture_client, "fix_2")

    # fix_2 failed with error type Timeout at step 0, which is named "fetch".
    assert "Timeout" in text
    assert "fetch" in text
    assert "step timed out" in text


def test_run_with_no_steps_and_out_of_range_step_index_is_explained(real_client):
    text = explain(real_client, "run_0089")

    assert "SchemaMismatch" in text
    assert "step 3, which was not recorded" in text
    assert "no recorded steps" in text


def test_null_cost_is_reported_as_not_recorded_never_zero(real_client):
    text = explain(real_client, "run_0042")

    assert "cost not recorded" in text
    assert "$0" not in text


def test_zero_cost_is_a_real_price(fixture_client):
    # fix_1 costs 0.5; a priced run shows the amount and not the "not recorded" wording.
    text = explain(fixture_client, "fix_1")

    assert "$0.5000" in text
    assert "not recorded" not in text.replace("duration not recorded", "")


def test_running_and_cancelled_runs_are_described(fixture_client):
    assert "still in progress" in explain(fixture_client, "fix_5")
    assert "cancelled before any step was recorded" in explain(fixture_client, "fix_3")


def test_warnings_are_mentioned(real_client):
    assert "data warnings" in explain(real_client, "run_0064")


def test_unknown_run_returns_404_json(real_client):
    response = real_client.post("/api/runs/run_9999/explain")

    assert response.status_code == 404
    assert response.json() == {"detail": "Run run_9999 not found"}


def test_unknown_provider_name_raises_a_clear_error(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("EXPLAIN_PROVIDER", "gpt-nine")

    with pytest.raises(ValueError, match="Unknown EXPLAIN_PROVIDER 'gpt-nine'. Allowed values: mock"):
        get_provider()


def test_server_refuses_to_start_with_an_unknown_provider(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("EXPLAIN_PROVIDER", "gpt-nine")

    with pytest.raises(ValueError, match="Allowed values: mock"):
        with TestClient(app):
            pass
