import pytest

from app import main

VERCEL_ORIGIN = "https://agent-run-explorer-lovat.vercel.app"
EXPLAIN_URL = "/api/runs/run_0042/explain"


# CORS_ORIGINS is read once when app.main is imported, so the test adds the deployed origin to the same list
# the middleware holds, and takes it out again afterwards.
@pytest.fixture
def vercel_allowed():
    main.allowed_origins.append(VERCEL_ORIGIN)
    yield
    main.allowed_origins.remove(VERCEL_ORIGIN)


def preflight(client, origin: str, method: str, headers: str = ""):
    request_headers = {"Origin": origin, "Access-Control-Request-Method": method}
    if headers:
        request_headers["Access-Control-Request-Headers"] = headers
    return client.options(EXPLAIN_URL, headers=request_headers)


def test_explain_preflight_from_the_deployed_frontend_succeeds(real_client, vercel_allowed):
    response = preflight(real_client, VERCEL_ORIGIN, "POST")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == VERCEL_ORIGIN
    assert "POST" in response.headers["access-control-allow-methods"]


def test_content_type_header_is_allowed(real_client, vercel_allowed):
    assert preflight(real_client, VERCEL_ORIGIN, "POST", "content-type").status_code == 200


def test_explain_post_from_the_deployed_frontend_gets_the_allow_origin_header(real_client, vercel_allowed):
    response = real_client.post(EXPLAIN_URL, headers={"Origin": VERCEL_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == VERCEL_ORIGIN


def test_methods_the_api_does_not_use_are_refused(real_client, vercel_allowed):
    assert preflight(real_client, VERCEL_ORIGIN, "DELETE").status_code == 400


def test_other_headers_are_refused(real_client, vercel_allowed):
    assert preflight(real_client, VERCEL_ORIGIN, "POST", "x-custom").status_code == 400


def test_unknown_origin_is_refused(real_client):
    assert preflight(real_client, "https://evil.example", "POST").status_code == 400
