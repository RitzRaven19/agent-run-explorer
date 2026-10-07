def test_run_detail_includes_steps(real_client):
    response = real_client.get("/api/runs/run_0042")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "run_0042"
    assert len(body["steps"]) > 0
    assert [step["index"] for step in body["steps"]] == list(range(len(body["steps"])))
    assert body["cost_usd"] is None
    assert any("unpriced" in warning for warning in body["warnings"])


def test_unknown_run_returns_404_with_json_detail(real_client):
    response = real_client.get("/api/runs/run_9999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Run run_9999 not found"}


def test_run_with_no_steps_and_an_error_step_index_returns_normally(real_client):
    response = real_client.get("/api/runs/run_0089")

    assert response.status_code == 200
    body = response.json()
    assert body["steps"] == []
    assert body["error"]["step_index"] == 3
    assert any("step 3" in warning for warning in body["warnings"])


def test_health_reports_run_count_and_data_warnings(real_client):
    response = real_client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["run_count"] == 200
    assert len(body["data_warnings"]) > 0
