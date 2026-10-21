from starlette.testclient import TestClient


def test_search_suggestions_empty(client: TestClient):
    res = client.get("/api/products/suggest?q=")
    # Query min_length is 1, so empty string should fail validation
    assert res.status_code == 422


def test_search_suggestions_query_matching(client: TestClient):
    res = client.get("/api/products/suggest?q=benevision")
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "benevision"
    assert "products" in data
    assert "categories" in data
    assert "brands" in data
    assert len(data["products"]) >= 1

    first = data["products"][0]
    assert "BeneVision" in first["name"]
    assert "slug" in first
    assert "sku" in first
    assert "brand_name" in first


def test_search_suggestions_by_sku(client: TestClient):
    res = client.get("/api/products/suggest?q=MN-N12")
    assert res.status_code == 200
    data = res.json()
    assert len(data["products"]) >= 1
    assert any("MN-N12" in p["sku"] for p in data["products"])


def test_search_suggestions_category_and_brand_matching(client: TestClient):
    res = client.get("/api/products/suggest?q=Diagnostic")
    assert res.status_code == 200
    data = res.json()
    assert any("Diagnostic" in c["name"] for c in data["categories"])


def test_search_suggestions_brand_matching(client: TestClient):
    res = client.get("/api/products/suggest?q=Mindray")
    assert res.status_code == 200
    data = res.json()
    assert any("Mindray" in b["name"] for b in data["brands"])


def test_search_suggestions_limit(client: TestClient):
    res = client.get("/api/products/suggest?q=monitor&limit=2")
    assert res.status_code == 200
    data = res.json()
    assert len(data["products"]) <= 2
