from starlette.testclient import TestClient


def test_unauthenticated_user_cannot_submit_quote(client: TestClient):
    payload = {
        "facility_name": "Mediclinic Panorama",
        "contact_name": "Dr. Johan van der Merwe",
        "email": "johan@mediclinic.co.za",
        "phone": "+27 21 938 2111",
        "items": [
            {
                "product_name": "BeneVision N12 Patient Monitor",
                "quantity": 1,
            }
        ],
    }
    # Unauthenticated attempt should fail with 401
    response = client.post("/api/quotes", json=payload)
    assert response.status_code == 401


def test_authenticated_user_submit_and_my_quotes(
    client: TestClient, user_token_headers: dict
):
    payload = {
        "facility_name": "Cape Primary Care Clinic",
        "contact_name": "Test User",
        "email": "user@test.com",
        "phone": "+27 82 123 4567",
        "sector": "Clinics & Primary Care",
        "city": "Durban",
        "urgency": "Urgent",
        "notes": "Urgent clinic setup",
        "items": [
            {
                "product_name": "Portable ECG Machine",
                "product_sku": "ECG-01",
                "brand_name": "Contec",
                "quantity": 2,
                "item_notes": "Include 10 rolls of paper",
            }
        ],
    }
    # Submit with user auth headers
    response = client.post("/api/quotes", json=payload, headers=user_token_headers)
    assert response.status_code == 201
    created_quote = response.json()
    assert created_quote["user_id"] is not None
    assert created_quote["facility_name"] == "Cape Primary Care Clinic"
    assert created_quote["quote_number"].startswith("QR-")
    assert len(created_quote["items"]) == 1
    assert created_quote["items"][0]["quantity"] == 2
    assert created_quote["items"][0]["item_notes"] == "Include 10 rolls of paper"

    # Retrieve from /my-quotes
    my_quotes_res = client.get("/api/quotes/my-quotes", headers=user_token_headers)
    assert my_quotes_res.status_code == 200
    my_quotes = my_quotes_res.json()
    assert any(q["id"] == created_quote["id"] for q in my_quotes)


def test_validation_requires_at_least_one_item(
    client: TestClient, user_token_headers: dict
):
    bad_payload = {
        "facility_name": "Empty Hospital",
        "contact_name": "Admin",
        "email": "admin@hospital.com",
        "phone": "0123456789",
        "items": [],  # Empty items list
    }
    resp = client.post("/api/quotes", json=bad_payload, headers=user_token_headers)
    assert resp.status_code == 422


def test_admin_list_and_filter_quotes(
    client: TestClient, admin_token_headers: dict, user_token_headers: dict
):
    # Create a quote first as user
    payload = {
        "facility_name": "Filter Test Hospital",
        "contact_name": "Sister Mary",
        "email": "mary@hospital.co.za",
        "phone": "+27 11 234 5678",
        "items": [{"product_name": "Infusion Pump", "quantity": 1}],
    }
    client.post("/api/quotes", json=payload, headers=user_token_headers)

    # Retrieve quotes as admin
    resp = client.get("/api/quotes", headers=admin_token_headers)
    assert resp.status_code == 200
    assert "x-total-count" in resp.headers
    data = resp.json()
    assert isinstance(data, list)

    # Filter by status
    resp_filtered = client.get("/api/quotes?status=New", headers=admin_token_headers)
    assert resp_filtered.status_code == 200
    for q in resp_filtered.json():
        assert q["status"] == "New"


def test_admin_update_quote_status_and_notes(
    client: TestClient, admin_token_headers: dict, user_token_headers: dict
):
    # First create a quote as authenticated user
    payload = {
        "facility_name": "Netcare St Augustine",
        "contact_name": "Sister Nomsa",
        "email": "nomsa@netcare.co.za",
        "phone": "+27 31 268 5000",
        "items": [{"product_name": "Defibrillator", "quantity": 1}],
    }
    create_res = client.post("/api/quotes", json=payload, headers=user_token_headers)
    assert create_res.status_code == 201
    quote_id = create_res.json()["id"]

    # Update quote status and notes
    patch_payload = {
        "status": "Quoted",
        "internal_notes": "Official quote sent via email to Sister Nomsa.",
        "quoted_amount": "R 145,000.00",
    }
    patch_res = client.patch(
        f"/api/quotes/{quote_id}", json=patch_payload, headers=admin_token_headers
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "Quoted"
    assert updated["internal_notes"] == "Official quote sent via email to Sister Nomsa."
    assert updated["quoted_amount"] == "R 145,000.00"


def test_admin_quote_stats(client: TestClient, admin_token_headers: dict):
    stats_res = client.get("/api/quotes/stats", headers=admin_token_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_quotes" in stats
    assert "new_quotes" in stats
    assert "quoted_quotes" in stats
    assert stats["total_quotes"] >= 1


def test_regular_user_cannot_access_admin_quote_endpoints(
    client: TestClient, user_token_headers: dict
):
    # Regular user cannot list all quotes
    res = client.get("/api/quotes", headers=user_token_headers)
    assert res.status_code == 403

    # Regular user cannot get stats
    res_stats = client.get("/api/quotes/stats", headers=user_token_headers)
    assert res_stats.status_code == 403


def test_my_quotes_search_and_pagination(client: TestClient, user_token_headers: dict):
    # Create 3 quotes with distinct facility names and items
    for i in range(3):
        client.post(
            "/api/quotes",
            json={
                "facility_name": f"Unique Search Hospital {i}",
                "contact_name": f"Contact Person {i}",
                "email": "user@test.com",
                "phone": "+27 82 000 0000",
                "items": [
                    {
                        "product_name": f"Product Alpha {i}",
                        "quantity": 1 + i,
                    }
                ],
            },
            headers=user_token_headers,
        )

    # 1. Test pagination: limit 2
    res_page1 = client.get(
        "/api/quotes/my-quotes?skip=0&limit=2", headers=user_token_headers
    )
    assert res_page1.status_code == 200
    assert "x-total-count" in res_page1.headers
    assert int(res_page1.headers["x-total-count"]) >= 3
    assert res_page1.headers["x-page"] == "1"
    assert res_page1.headers["x-page-size"] == "2"
    assert len(res_page1.json()) == 2

    # 2. Test search: search by specific facility name
    res_search = client.get(
        "/api/quotes/my-quotes?search=Unique Search Hospital 1",
        headers=user_token_headers,
    )
    assert res_search.status_code == 200
    results = res_search.json()
    assert len(results) == 1
    assert results[0]["facility_name"] == "Unique Search Hospital 1"

    # 3. Test search: search by item name
    res_item_search = client.get(
        "/api/quotes/my-quotes?search=Product Alpha 2",
        headers=user_token_headers,
    )
    assert res_item_search.status_code == 200
    item_results = res_item_search.json()
    assert len(item_results) == 1
    assert item_results[0]["facility_name"] == "Unique Search Hospital 2"
