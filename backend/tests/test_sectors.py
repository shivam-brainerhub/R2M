import pytest
from starlette.testclient import TestClient
from app.models import Product, Sector


def test_list_sectors_public(client: TestClient):
    response = client.get("/api/sectors")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert "id" in first
    assert "name" in first
    assert "product_count" in first
    assert isinstance(first["product_count"], int)


def test_get_sector_by_id(client: TestClient):
    list_res = client.get("/api/sectors")
    assert list_res.status_code == 200
    sectors = list_res.json()
    assert len(sectors) > 0
    sector_id = sectors[0]["id"]

    res = client.get(f"/api/sectors/{sector_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == sector_id
    assert "name" in data
    assert "product_count" in data


def test_get_sector_not_found(client: TestClient):
    res = client.get("/api/sectors/999999")
    assert res.status_code == 404


def test_products_filter_by_sector(client: TestClient, db_session):
    sector = db_session.query(Sector).first()
    product = db_session.query(Product).first()
    assert sector is not None
    assert product is not None

    if sector not in product.sectors:
        product.sectors.append(sector)
        db_session.commit()

    # Filter products by sector name
    res = client.get("/api/products", params={"sector": sector.name})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert any(p["id"] == product.id for p in data)


def test_filter_options_includes_sectors(client: TestClient):
    res = client.get("/api/products/filters")
    assert res.status_code == 200
    data = res.json()
    assert "sectors" in data
    assert isinstance(data["sectors"], list)
    assert len(data["sectors"]) >= 1
    first = data["sectors"][0]
    assert "id" in first
    assert "name" in first
    assert "count" in first


def test_product_create_and_update_with_sectors(client: TestClient, admin_token_headers, db_session):
    sector = db_session.query(Sector).first()
    assert sector is not None

    # Create a product with sector_ids
    payload = {
        "name": "Sector Test Monitor",
        "slug": "sector-test-monitor",
        "sku": "SEC-TEST-001",
        "description": "Sector testing product",
        "status": "Active",
        "sector_ids": [sector.id],
    }
    create_res = client.post(
        "/api/products",
        json=payload,
        headers=admin_token_headers,
    )
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert "sectors" in created_data
    assert any(s["id"] == sector.id for s in created_data["sectors"])

    prod_id = created_data["id"]

    # Update with empty sector_ids
    update_res = client.put(
        f"/api/products/{prod_id}",
        json={"sector_ids": []},
        headers=admin_token_headers,
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert len(updated_data["sectors"]) == 0

    # Re-associate sector
    update_res2 = client.put(
        f"/api/products/{prod_id}",
        json={"sector_ids": [sector.id]},
        headers=admin_token_headers,
    )
    assert update_res2.status_code == 200
    assert len(update_res2.json()["sectors"]) == 1

    # Cleanup test product
    del_res = client.delete(f"/api/products/{prod_id}", headers=admin_token_headers)
    assert del_res.status_code == 200
