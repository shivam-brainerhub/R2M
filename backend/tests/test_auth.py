import uuid
from starlette.testclient import TestClient


def test_health_endpoint(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["auth_enabled"] is True


def test_register_public_user_success(client: TestClient):
    unique_id = uuid.uuid4().hex[:8]
    payload = {
        "email": f"user_{unique_id}@hospital.org",
        "username": f"user_{unique_id}",
        "password": "StrongPassword123!",
        "full_name": "Dr. John Test",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["username"] == payload["username"]
    assert data["role"] == "user"
    assert data["is_active"] is True
    assert "hashed_password" not in data


def test_register_duplicate_email(client: TestClient, test_regular_user):
    payload = {
        "email": test_regular_user.email,
        "username": "brand_new_username",
        "password": "Password123!",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "email already exists" in response.json()["detail"]


def test_register_duplicate_username(client: TestClient, test_regular_user):
    payload = {
        "email": "unique_email_123@hospital.org",
        "username": test_regular_user.username,
        "password": "Password123!",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "username already exists" in response.json()["detail"]


def test_login_success_with_email(client: TestClient, test_regular_user):
    payload = {
        "username_or_email": test_regular_user.email,
        "password": "UserPass123!",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_success_with_username(client: TestClient, test_regular_user):
    payload = {
        "username_or_email": test_regular_user.username,
        "password": "UserPass123!",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_invalid_password(client: TestClient, test_regular_user):
    payload = {
        "username_or_email": test_regular_user.username,
        "password": "WrongPassword999!",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert "Incorrect username/email or password" in response.json()["detail"]


def test_login_nonexistent_user(client: TestClient):
    payload = {
        "username_or_email": "non_existent_user_999",
        "password": "AnyPassword123!",
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401


def test_oauth2_form_login(client: TestClient, test_regular_user):
    response = client.post(
        "/api/auth/login/oauth",
        data={"username": test_regular_user.username, "password": "UserPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_get_current_user_profile(client: TestClient, user_token_headers, test_regular_user):
    response = client.get("/api/auth/me", headers=user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_regular_user.id
    assert data["email"] == test_regular_user.email
    assert data["role"] == "user"


def test_get_current_user_profile_unauthorized(client: TestClient):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_get_current_user_profile_invalid_token(client: TestClient):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token_12345"},
    )
    assert response.status_code == 401


def test_refresh_token_flow(client: TestClient, test_regular_user):
    login_resp = client.post(
        "/api/auth/login",
        json={"username_or_email": test_regular_user.username, "password": "UserPass123!"},
    )
    refresh_token = login_resp.json()["refresh_token"]

    refresh_resp = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    data = refresh_resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_refresh_token_rejects_access_token(client: TestClient, test_regular_user):
    login_resp = client.post(
        "/api/auth/login",
        json={"username_or_email": test_regular_user.username, "password": "UserPass123!"},
    )
    access_token = login_resp.json()["access_token"]

    # Passing access token where refresh token is expected should fail
    refresh_resp = client.post(
        "/api/auth/refresh",
        json={"refresh_token": access_token},
    )
    assert refresh_resp.status_code == 401
    assert "refresh token required" in refresh_resp.json()["detail"].lower()


def test_change_password_flow(client: TestClient, test_regular_user):
    login_resp = client.post(
        "/api/auth/login",
        json={"username_or_email": test_regular_user.username, "password": "UserPass123!"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Wrong current password
    fail_resp = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "WrongPassword!", "new_password": "NewUserPass123!"},
    )
    assert fail_resp.status_code == 400

    # Correct current password
    success_resp = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "UserPass123!", "new_password": "NewUserPass123!"},
    )
    assert success_resp.status_code == 200

    # Revert password back for test consistency
    client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "NewUserPass123!", "new_password": "UserPass123!"},
    )
