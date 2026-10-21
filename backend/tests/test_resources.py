from app.models import Brand, Category, Document, Product
from starlette.testclient import TestClient


def test_list_resources(client: TestClient, db_session):
    # Ensure there is a test category, brand, and product
    cat = Category(name="Resource Test Cat", slug="res-test-cat")
    db_session.add(cat)
    db_session.flush()

    brand = Brand(name="Resource Test Brand", slug="res-test-brand")
    db_session.add(brand)
    db_session.flush()

    prod = Product(
        name="Resource Test Monitor",
        slug="res-test-monitor",
        category_id=cat.id,
        brand_id=brand.id,
        brochure_url="/media/brochures/contec-cms5100-patient-monitor.pdf",
        status="Active",
    )
    db_session.add(prod)
    db_session.flush()

    doc = Document(
        product_id=prod.id,
        title="Test Clinical Manual",
        file_url="/media/brochures/cu-medical-ipad-cu-sp1-intelligent-aed.pdf",
        type="User Manual",
    )
    db_session.add(doc)
    db_session.commit()

    # 1. Query all resources
    response = client.get("/api/resources")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    titles = [d["title"] for d in data]
    assert "Test Clinical Manual" in titles
    assert "Resource Test Monitor Product Brochure" in titles

    # 2. Filter by type
    manual_resp = client.get("/api/resources?type=Manual")
    assert manual_resp.status_code == 200
    manual_data = manual_resp.json()
    assert any(d["title"] == "Test Clinical Manual" for d in manual_data)
    assert not any("Product Brochure" in d["title"] for d in manual_data)

    # 3. Filter by search query
    search_resp = client.get("/api/resources?search=Clinical")
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert any(d["title"] == "Test Clinical Manual" for d in search_data)

    # 4. Backend Pagination (paginated=True envelope and headers)
    paged_resp = client.get("/api/resources?paginated=true&page=1&page_size=1")
    assert paged_resp.status_code == 200
    paged_data = paged_resp.json()
    assert "items" in paged_data
    assert len(paged_data["items"]) == 1
    assert paged_data["total"] >= 2
    assert paged_data["page"] == 1
    assert paged_data["page_size"] == 1
    assert paged_data["has_more"] is True
    assert paged_resp.headers["X-Total-Count"] == str(paged_data["total"])
    assert paged_resp.headers["X-Has-More"] == "true"


def test_download_document_unauthenticated(client: TestClient):
    # Attempting to download without token or authorization header fails with 401
    response = client.get(
        "/api/documents/download?url=/media/brochures/contec-cms5100-patient-monitor.pdf"
    )
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]


def test_download_document_authenticated(client: TestClient, user_token_headers):
    # 1. Using Authorization header
    response = client.get(
        "/api/documents/download?url=/media/brochures/contec-cms5100-patient-monitor.pdf",
        headers=user_token_headers,
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]


def test_download_document_path_traversal_blocked(
    client: TestClient, user_token_headers
):
    # Attempting to download arbitrary system files outside MEDIA_DIR must be blocked with 400
    response = client.get(
        "/api/documents/download?url=../../etc/passwd",
        headers=user_token_headers,
    )
    assert response.status_code == 400
    assert "Invalid file path" in response.json()["detail"]
