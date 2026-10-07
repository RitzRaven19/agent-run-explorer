from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "stats_fixture.jsonl"


# The loaded data lives in module-level lists that every startup refills. A fresh client per test
# (the `with` block runs startup) means a test never sees data left behind by another one.
@pytest.fixture
def real_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("DATA_PATH", raising=False)
    with TestClient(app) as client:
        yield client


@pytest.fixture
def fixture_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATA_PATH", str(FIXTURE_PATH))
    with TestClient(app) as client:
        yield client
