from starlette.testclient import TestClient


def test_list_categories_public(client: TestClient):
    response = client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert "name" in first
    assert "slug" in first
    assert "product_count" in first
    assert "x-total-count" in response.headers


def test_list_categories_pagination(client: TestClient):
    response = client.get("/api/categories?skip=0&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert "x-total-count" in response.headers
    assert int(response.headers["x-total-count"]) >= 1


def test_list_brands_pagination(client: TestClient):
    response = client.get("/api/brands?skip=0&limit=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert "x-total-count" in response.headers
    assert int(response.headers["x-total-count"]) >= 1


def test_get_category_by_id(client: TestClient):
    # First get list
    list_res = client.get("/api/categories")
    assert list_res.status_code == 200
    cat_id = list_res.json()[0]["id"]

    res = client.get(f"/api/categories/{cat_id}")
    assert res.status_code == 200
    assert res.json()["id"] == cat_id


def test_create_category_unauthorized(client: TestClient):
    res = client.post(
        "/api/categories",
        json={"name": "Unauthorized Category", "code": "99"},
    )
    assert res.status_code == 401


def test_create_category_forbidden_for_user(client: TestClient, user_token_headers):
    res = client.post(
        "/api/categories",
        json={"name": "Forbidden Category", "code": "99"},
        headers=user_token_headers,
    )
    assert res.status_code == 403


def test_create_update_delete_category_admin(client: TestClient, admin_token_headers):
    # 1. Create
    payload = {
        "name": "Cardiology Diagnostics",
        "code": "10",
        "description": "Specialized cardiology diagnostic tools",
        "icon": "cardiology",
    }
    create_res = client.post(
        "/api/categories",
        json=payload,
        headers=admin_token_headers,
    )
    assert create_res.status_code == 201
    cat_data = create_res.json()
    cat_id = cat_data["id"]
    assert cat_data["name"] == "Cardiology Diagnostics"
    assert cat_data["slug"] == "cardiology-diagnostics"
    assert cat_data["code"] == "10"

    # 2. Duplicate name error
    dup_res = client.post(
        "/api/categories",
        json=payload,
        headers=admin_token_headers,
    )
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Update
    update_res = client.put(
        f"/api/categories/{cat_id}",
        json={"name": "Cardiology & Vascular", "code": "10B"},
        headers=admin_token_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Cardiology & Vascular"
    assert update_res.json()["code"] == "10B"

    # 4. Delete
    del_res = client.delete(
        f"/api/categories/{cat_id}",
        headers=admin_token_headers,
    )
    assert del_res.status_code == 200
    assert "deleted successfully" in del_res.json()["message"]

    # Verify not found after delete
    get_res = client.get(f"/api/categories/{cat_id}")
    assert get_res.status_code == 404


def test_list_brands_public(client: TestClient):
    response = client.get("/api/brands")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert "name" in first
    assert "featured_in_slider" in first
    assert "product_count" in first


def test_list_brands_filter_slider(client: TestClient):
    res = client.get("/api/brands?featured_in_slider=true")
    assert res.status_code == 200
    for brand in res.json():
        assert brand["featured_in_slider"] is True


def test_create_update_toggle_delete_brand_admin(
    client: TestClient, admin_token_headers
):
    # 1. Create brand
    payload = {
        "name": "BioX Systems",
        "country": "Germany",
        "description": "High-precision laboratory analyzers",
        "logo_url": "/logos/biox.png",
        "website_url": "https://biox.example.com",
        "featured_in_slider": True,
    }
    create_res = client.post(
        "/api/brands",
        json=payload,
        headers=admin_token_headers,
    )
    assert create_res.status_code == 201
    brand_data = create_res.json()
    brand_id = brand_data["id"]
    assert brand_data["name"] == "BioX Systems"
    assert brand_data["country"] == "Germany"

    # 2. Toggle slider
    toggle_res = client.post(
        f"/api/brands/{brand_id}/toggle-slider",
        headers=admin_token_headers,
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["featured_in_slider"] is False

    # 3. Update brand
    update_res = client.put(
        f"/api/brands/{brand_id}",
        json={
            "country": "Switzerland",
            "description": "Swiss-engineered laboratory equipment",
        },
        headers=admin_token_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["country"] == "Switzerland"

    # 4. Delete brand
    del_res = client.delete(
        f"/api/brands/{brand_id}",
        headers=admin_token_headers,
    )
    assert del_res.status_code == 200

    # Verify not found
    get_res = client.get(f"/api/brands/{brand_id}")
    assert get_res.status_code == 404


def test_upload_brand_logo(client: TestClient, admin_token_headers, user_token_headers):
    # 1. Unauthorized
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    unauth_res = client.post(
        "/api/brands/upload-logo",
        files={"file": ("test_logo.png", fake_png, "image/png")},
    )
    assert unauth_res.status_code == 401

    # 2. Forbidden for regular user
    forbidden_res = client.post(
        "/api/brands/upload-logo",
        files={"file": ("test_logo.png", fake_png, "image/png")},
        headers=user_token_headers,
    )
    assert forbidden_res.status_code == 403

    # 3. Successful admin upload
    upload_res = client.post(
        "/api/brands/upload-logo",
        files={"file": ("my_brand_logo.png", fake_png, "image/png")},
        headers=admin_token_headers,
    )
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert "url" in data
    assert data["url"].startswith("/media/brands/")
    assert data["url"].endswith(".png")
