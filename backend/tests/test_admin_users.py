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


def test_admin_delete_user_requires_suspension(client: TestClient, admin_token_headers):
    unique_id = uuid.uuid4().hex[:8]
    create_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"delete_target_{unique_id}@r2m.co.za",
            "username": f"del_{unique_id}",
            "password": "Password123!",
            "role": "user",
        },
    )
    target_id = create_resp.json()["id"]

    # Attempt to delete active user -> Should fail with 400
    fail_del_resp = client.delete(
        f"/api/admin/users/{target_id}", headers=admin_token_headers
    )
    assert fail_del_resp.status_code == 400
    assert "only suspended accounts can be deleted" in fail_del_resp.json()["detail"].lower()

    # Suspend user first
    suspend_resp = client.post(
        f"/api/admin/users/{target_id}/status?is_active=false",
        headers=admin_token_headers,
    )
    assert suspend_resp.status_code == 200
    assert suspend_resp.json()["is_active"] is False

    # Now deletion must succeed
    del_resp = client.delete(
        f"/api/admin/users/{target_id}", headers=admin_token_headers
    )
    assert del_resp.status_code == 200
    assert "deleted successfully" in del_resp.json()["message"]

    # Verify user is gone (404)
    get_resp = client.get(
        f"/api/admin/users/{target_id}", headers=admin_token_headers
    )
    assert get_resp.status_code == 404


def test_admin_cannot_delete_self(
    client: TestClient, admin_token_headers, test_admin_user
):
    response = client.delete(
        f"/api/admin/users/{test_admin_user.id}", headers=admin_token_headers
    )
    assert response.status_code == 400
    assert "cannot delete your own" in response.json()["detail"].lower()


def test_admin_suspend_and_unsuspend_user(client: TestClient, admin_token_headers):
    unique_id = uuid.uuid4().hex[:8]
    create_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"suspend_target_{unique_id}@r2m.co.za",
            "username": f"susp_{unique_id}",
            "password": "Password123!",
            "role": "user",
        },
    )
    target_id = create_resp.json()["id"]

    # Suspend user
    suspend_resp = client.post(
        f"/api/admin/users/{target_id}/status?is_active=false",
        headers=admin_token_headers,
    )
    assert suspend_resp.status_code == 200
    assert suspend_resp.json()["is_active"] is False

    # Unsuspend user
    unsuspend_resp = client.post(
        f"/api/admin/users/{target_id}/status?is_active=true",
        headers=admin_token_headers,
    )
    assert unsuspend_resp.status_code == 200
    assert unsuspend_resp.json()["is_active"] is True


def test_admin_set_user_password(client: TestClient, admin_token_headers):
    unique_id = uuid.uuid4().hex[:8]
    create_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"pwd_target_{unique_id}@r2m.co.za",
            "username": f"pwd_{unique_id}",
            "password": "OldPassword123!",
            "role": "user",
        },
    )
    target_id = create_resp.json()["id"]
    email = create_resp.json()["email"]

    # Set password
    set_pwd_resp = client.post(
        f"/api/admin/users/{target_id}/set-password",
        headers=admin_token_headers,
        json={"new_password": "BrandNewPassword123!"},
    )
    assert set_pwd_resp.status_code == 200
    assert "updated successfully" in set_pwd_resp.json()["message"]

    # Login with new password
    login_resp = client.post(
        "/api/auth/login",
        json={"username_or_email": email, "password": "BrandNewPassword123!"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_admin_resend_confirmation_email(client: TestClient, admin_token_headers):
    unique_id = uuid.uuid4().hex[:8]
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "email": f"unconfirmed_{unique_id}@r2m.co.za",
            "username": f"unconf_{unique_id}",
            "password": "Password123!",
            "full_name": "Unconfirmed User",
        },
    )
    target_id = reg_resp.json()["id"]
    assert reg_resp.json()["is_email_verified"] is False

    # Resend confirmation email via admin endpoint
    resend_resp = client.post(
        f"/api/admin/users/{target_id}/resend-confirmation",
        headers=admin_token_headers,
    )
    assert resend_resp.status_code == 200
    assert "successfully sent" in resend_resp.json()["message"]


def test_admin_list_users_search_filter_sort(client: TestClient, admin_token_headers):
    # Search
    search_resp = client.get(
        "/api/admin/users?search=admin",
        headers=admin_token_headers,
    )
    assert search_resp.status_code == 200
    assert len(search_resp.json()) >= 1

    # Filter by verified
    filter_resp = client.get(
        "/api/admin/users?is_email_verified=false",
        headers=admin_token_headers,
    )
    assert filter_resp.status_code == 200
    for u in filter_resp.json():
        assert u["is_email_verified"] is False

    # Sort by username ascending
    sort_resp = client.get(
        "/api/admin/users?sort_by=username&sort_order=asc",
        headers=admin_token_headers,
    )
    assert sort_resp.status_code == 200
    usernames = [u["username"].lower() for u in sort_resp.json()]
    assert usernames == sorted(usernames)
