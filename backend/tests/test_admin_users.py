import uuid
from starlette.testclient import TestClient


def test_regular_user_cannot_access_admin_users(client: TestClient, user_token_headers):
    # Regular authenticated user must be denied access to admin endpoint
    response = client.get("/api/admin/users", headers=user_token_headers)
    assert response.status_code == 403
    assert "Admin privileges required" in response.json()["detail"]


def test_unauthenticated_cannot_access_admin_users(client: TestClient):
    response = client.get("/api/admin/users")
    assert response.status_code == 401


def test_admin_list_users_success(client: TestClient, admin_token_headers):
    response = client.get("/api/admin/users", headers=admin_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_admin_create_new_admin_user(client: TestClient, admin_token_headers):
    unique_id = uuid.uuid4().hex[:8]
    payload = {
        "email": f"sub_admin_{unique_id}@r2m.co.za",
        "username": f"sub_admin_{unique_id}",
        "full_name": "Assistant Admin",
        "password": "SecureAdmin123!",
        "role": "admin",
        "is_active": True,
    }
    response = client.post("/api/admin/users", headers=admin_token_headers, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["role"] == "admin"


def test_admin_create_new_public_user(client: TestClient, admin_token_headers):
    unique_id = uuid.uuid4().hex[:8]
    payload = {
        "email": f"client_{unique_id}@clinic.co.za",
        "username": f"client_{unique_id}",
        "full_name": "Clinic Purchaser",
        "password": "SecureUser123!",
        "role": "user",
        "is_active": True,
    }
    response = client.post("/api/admin/users", headers=admin_token_headers, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["role"] == "user"


def test_admin_get_user_by_id(client: TestClient, admin_token_headers, test_regular_user):
    response = client.get(
        f"/api/admin/users/{test_regular_user.id}", headers=admin_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_regular_user.id
    assert data["username"] == test_regular_user.username


def test_admin_update_user(client: TestClient, admin_token_headers):
    # First create a user to update
    unique_id = uuid.uuid4().hex[:8]
    create_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"update_target_{unique_id}@r2m.co.za",
            "username": f"update_{unique_id}",
            "full_name": "Initial Name",
            "password": "Password123!",
            "role": "user",
        },
    )
    created_id = create_resp.json()["id"]

    # Now update their name and promote to admin
    update_resp = client.put(
        f"/api/admin/users/{created_id}",
        headers=admin_token_headers,
        json={"full_name": "Updated Name", "role": "admin"},
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["full_name"] == "Updated Name"
    assert data["role"] == "admin"


def test_admin_deactivate_user(client: TestClient, admin_token_headers):
    unique_id = uuid.uuid4().hex[:8]
    create_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"deactivate_target_{unique_id}@r2m.co.za",
            "username": f"deact_{unique_id}",
            "password": "Password123!",
            "role": "user",
        },
    )
    target_id = create_resp.json()["id"]

    # Deactivate
    deact_resp = client.delete(
        f"/api/admin/users/{target_id}", headers=admin_token_headers
    )
    assert deact_resp.status_code == 200

    # Verify is_active is now False
    get_resp = client.get(
        f"/api/admin/users/{target_id}", headers=admin_token_headers
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["is_active"] is False


def test_admin_cannot_deactivate_self(
    client: TestClient, admin_token_headers, test_admin_user
):
    response = client.delete(
        f"/api/admin/users/{test_admin_user.id}", headers=admin_token_headers
    )
    assert response.status_code == 400
    assert "cannot deactivate your own" in response.json()["detail"].lower()
