from starlette.testclient import TestClient


def test_public_submit_contact_message(client: TestClient):
    payload = {
        "first_name": "Sarah",
        "last_name": "Jenkins",
        "email": "sarah.jenkins@hospital.co.za",
        "organization": "City General Hospital",
        "message": "We need a quotation for 5 patient monitors.",
    }
    response = client.post("/api/inquiries/contact", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Sarah"
    assert data["email"] == "sarah.jenkins@hospital.co.za"
    assert data["status"] == "New"
    assert "id" in data


def test_public_submit_supplier_application(client: TestClient):
    payload = {
        "company_name": "Apex Medical Instruments",
        "website": "https://www.apexmed.com",
        "contact_person": "David Vance",
        "job_title": "Regional Director",
        "email": "d.vance@apexmed.com",
        "phone": "+27 11 999 8888",
        "category": "Diagnostic and Measure",
        "overview": "Manufacturer of advanced surgical blades and diagnostic scopes.",
    }
    response = client.post("/api/inquiries/supplier", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["company_name"] == "Apex Medical Instruments"
    assert data["status"] == "New"
    assert "id" in data


def test_inquiries_validation_errors(client: TestClient):
    # Invalid email
    bad_contact = {
        "first_name": "Test",
        "last_name": "User",
        "email": "not-an-email",
        "message": "Short",
    }
    resp = client.post("/api/inquiries/contact", json=bad_contact)
    assert resp.status_code == 422


def test_regular_user_cannot_view_inquiries(
    client: TestClient, user_token_headers: dict
):
    resp1 = client.get("/api/inquiries/contact", headers=user_token_headers)
    assert resp1.status_code == 403

    resp2 = client.get("/api/inquiries/supplier", headers=user_token_headers)
    assert resp2.status_code == 403


def test_admin_list_and_update_contact_message(
    client: TestClient, admin_token_headers: dict
):
    # Create contact message first
    create_resp = client.post(
        "/api/inquiries/contact",
        json={
            "first_name": "Mark",
            "last_name": "Twain",
            "email": "mark.twain@med.org",
            "organization": "Twain Clinic",
            "message": "Requesting details on hospital beds.",
        },
    )
    msg_id = create_resp.json()["id"]

    # Admin list
    list_resp = client.get(
        "/api/inquiries/contact?status=New", headers=admin_token_headers
    )
    assert list_resp.status_code == 200
    assert "x-total-count" in list_resp.headers
    items = list_resp.json()
    assert any(i["id"] == msg_id for i in items)

    # Admin update status and notes
    patch_resp = client.patch(
        f"/api/inquiries/contact/{msg_id}",
        json={"status": "Responded", "notes": "Emailed catalog on Oct 14."},
        headers=admin_token_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Responded"
    assert patch_resp.json()["notes"] == "Emailed catalog on Oct 14."

    # Admin delete
    del_resp = client.delete(
        f"/api/inquiries/contact/{msg_id}", headers=admin_token_headers
    )
    assert del_resp.status_code == 204


def test_admin_list_and_update_supplier_application(
    client: TestClient, admin_token_headers: dict
):
    create_resp = client.post(
        "/api/inquiries/supplier",
        json={
            "company_name": "BioTech Solutions",
            "contact_person": "Alice Smith",
            "email": "alice@biotech.co.za",
            "phone": "+27 21 555 4321",
            "category": "Lab",
            "overview": "We manufacture microcentrifuges and laboratory testing plates.",
        },
    )
    app_id = create_resp.json()["id"]

    # Admin list
    list_resp = client.get("/api/inquiries/supplier", headers=admin_token_headers)
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert any(i["id"] == app_id for i in items)

    # Admin update
    patch_resp = client.patch(
        f"/api/inquiries/supplier/{app_id}",
        json={"status": "Approved", "notes": "Approved for vendor onboarding."},
        headers=admin_token_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Approved"


def test_admin_get_inquiries_stats(client: TestClient, admin_token_headers: dict):
    resp = client.get("/api/inquiries/stats", headers=admin_token_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "new_contact" in data
    assert "total_contact" in data
    assert "new_supplier" in data
    assert "total_supplier" in data
    assert "total_new" in data
    assert "in_progress_contact" in data
    assert "under_review_supplier" in data
    assert "total_in_progress" in data
    assert isinstance(data["total_in_progress"], int)
