import uuid

from starlette.testclient import TestClient


def test_regular_user_cannot_access_admin_users(client: TestClient, user_token_headers):
    # Regular authenticated user must be denied access to admin endpoint
    response = client.get("/api/admin/users", headers=user_token_headers)
    assert response.status_code == 403
    assert (
        "Admin privileges required" in response.json()["detail"]
        or "do not have permission" in response.json()["detail"].lower()
    )


def test_unauthenticated_cannot_access_admin_users(client: TestClient):
    response = client.get("/api/admin/users")
    assert response.status_code == 401


def test_admin_list_users_success(client: TestClient, admin_token_headers):
    response = client.get("/api/admin/users", headers=admin_token_headers)
    assert response.status_code == 200
    assert "x-total-count" in response.headers
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_admin_list_users_pagination(client: TestClient, admin_token_headers):
    response = client.get(
        "/api/admin/users?skip=0&limit=1", headers=admin_token_headers
    )
    assert response.status_code == 200
    assert "x-total-count" in response.headers
    data = response.json()
    assert len(data) == 1
    assert int(response.headers["x-total-count"]) >= 2
    assert response.headers["x-page"] == "1"
    assert response.headers["x-page-size"] == "1"
    assert response.headers["x-has-more"] == "true"


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
    response = client.post(
        "/api/admin/users", headers=admin_token_headers, json=payload
    )
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
    response = client.post(
        "/api/admin/users", headers=admin_token_headers, json=payload
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["role"] == "user"


def test_admin_get_user_by_id(
    client: TestClient, admin_token_headers, test_regular_user
):
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
    assert (
        "only suspended accounts can be deleted"
        in fail_del_resp.json()["detail"].lower()
    )

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
    get_resp = client.get(f"/api/admin/users/{target_id}", headers=admin_token_headers)
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


def test_admin_update_user_to_sales_rep_by_role_id(
    client: TestClient, admin_token_headers
):
    # Fetch roles to get sales_rep role id
    roles_res = client.get("/api/admin/roles", headers=admin_token_headers)
    assert roles_res.status_code == 200
    sales_role = next(r for r in roles_res.json() if r["slug"] == "sales_rep")

    # Create target user
    uid = uuid.uuid4().hex[:8]
    create_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"sales_{uid}@hospital.co.za",
            "username": f"sales_{uid}",
            "full_name": "Sales Candidate",
            "password": "Password123!",
            "role": "user",
        },
    )
    assert create_resp.status_code == 201
    target_id = create_resp.json()["id"]

    # Update role to sales_rep via role_id
    update_resp = client.put(
        f"/api/admin/users/{target_id}",
        headers=admin_token_headers,
        json={
            "role_id": sales_role["id"],
            "role": "sales_rep",
            "custom_permissions": {},
        },
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["role"] == "sales_rep"
    assert data["role_id"] == sales_role["id"]
    assert data["role_name"] == "Sales Representative"
    assert data["permissions"]["quotes"] == "read_write"
    assert data["permissions"]["products"] == "read"
    assert data["permissions"]["users"] == "none"


def test_admin_update_user_to_product_manager_by_slug(
    client: TestClient, admin_token_headers
):
    uid = uuid.uuid4().hex[:8]
    create_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"pm_{uid}@hospital.co.za",
            "username": f"pm_{uid}",
            "password": "Password123!",
            "role": "user",
        },
    )
    target_id = create_resp.json()["id"]

    # Update role via case-insensitive slug
    update_resp = client.put(
        f"/api/admin/users/{target_id}",
        headers=admin_token_headers,
        json={"role": "Product_Manager"},
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["role"] == "product_manager"
    assert data["role_name"] == "Product Manager"
    assert data["permissions"]["products"] == "read_write"


def test_admin_update_user_custom_permissions_override_and_clear(
    client: TestClient, admin_token_headers
):
    uid = uuid.uuid4().hex[:8]
    create_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"perm_{uid}@hospital.co.za",
            "username": f"perm_{uid}",
            "password": "Password123!",
            "role": "user",
        },
    )
    target_id = create_resp.json()["id"]

    # 1. Apply custom permission override
    perm_payload = {
        "custom_permissions": {
            "quotes": "read_write",
            "inquiries": "read",
        }
    }
    update_resp = client.put(
        f"/api/admin/users/{target_id}",
        headers=admin_token_headers,
        json=perm_payload,
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["has_custom_permissions"] is True
    assert data["permissions"]["quotes"] == "read_write"
    assert data["permissions"]["inquiries"] == "read"

    # 2. Clear custom permissions by passing empty dict
    clear_resp = client.put(
        f"/api/admin/users/{target_id}",
        headers=admin_token_headers,
        json={"custom_permissions": {}},
    )
    assert clear_resp.status_code == 200
    cleared_data = clear_resp.json()
    assert cleared_data["has_custom_permissions"] is False
    assert cleared_data["permissions"]["quotes"] == "none"


def test_admin_update_user_validation_failures(client: TestClient, admin_token_headers):
    uid = uuid.uuid4().hex[:8]
    create_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"valid_{uid}@hospital.co.za",
            "username": f"valid_{uid}",
            "password": "Password123!",
            "role": "user",
        },
    )
    target_id = create_resp.json()["id"]

    # 1. Invalid role_id -> 400
    res_bad_role = client.put(
        f"/api/admin/users/{target_id}",
        headers=admin_token_headers,
        json={"role_id": 99999},
    )
    assert res_bad_role.status_code == 400
    assert "does not exist" in res_bad_role.json()["detail"].lower()

    # 2. Invalid permission section -> 400
    res_bad_section = client.put(
        f"/api/admin/users/{target_id}",
        headers=admin_token_headers,
        json={"custom_permissions": {"invalid_section_name": "read"}},
    )
    assert res_bad_section.status_code == 400
    assert "invalid permission section" in res_bad_section.json()["detail"].lower()

    # 3. Invalid permission level -> 400
    res_bad_level = client.put(
        f"/api/admin/users/{target_id}",
        headers=admin_token_headers,
        json={"custom_permissions": {"quotes": "superadmin"}},
    )
    assert res_bad_level.status_code == 400
    assert "invalid permission level" in res_bad_level.json()["detail"].lower()


def test_admin_update_user_duplicate_email_or_username(
    client: TestClient, admin_token_headers
):
    uid1 = uuid.uuid4().hex[:8]
    uid2 = uuid.uuid4().hex[:8]

    u1_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"u1_{uid1}@hospital.co.za",
            "username": f"u1_{uid1}",
            "password": "Password123!",
        },
    )
    assert u1_resp.status_code == 201
    u2_resp = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"u2_{uid2}@hospital.co.za",
            "username": f"u2_{uid2}",
            "password": "Password123!",
        },
    )
    u2_id = u2_resp.json()["id"]

    # Duplicate email
    dup_email_res = client.put(
        f"/api/admin/users/{u2_id}",
        headers=admin_token_headers,
        json={"email": f"u1_{uid1}@hospital.co.za"},
    )
    assert dup_email_res.status_code == 400
    assert "email is already taken" in dup_email_res.json()["detail"].lower()

    # Duplicate username
    dup_uname_res = client.put(
        f"/api/admin/users/{u2_id}",
        headers=admin_token_headers,
        json={"username": f"u1_{uid1}"},
    )
    assert dup_uname_res.status_code == 400
    assert "username is already taken" in dup_uname_res.json()["detail"].lower()


def test_admin_cannot_demote_self(
    client: TestClient, admin_token_headers, test_admin_user
):
    # Attempt to demote own admin account via role_id
    roles_res = client.get("/api/admin/roles", headers=admin_token_headers)
    sales_role = next(r for r in roles_res.json() if r["slug"] == "sales_rep")

    demote_res = client.put(
        f"/api/admin/users/{test_admin_user.id}",
        headers=admin_token_headers,
        json={"role_id": sales_role["id"]},
    )
    assert demote_res.status_code == 400
    assert (
        "cannot remove your own admin privileges" in demote_res.json()["detail"].lower()
    )

    # Attempt to demote own admin account via role string
    demote_res2 = client.put(
        f"/api/admin/users/{test_admin_user.id}",
        headers=admin_token_headers,
        json={"role": "user"},
    )
    assert demote_res2.status_code == 400
    assert (
        "cannot remove your own admin privileges"
        in demote_res2.json()["detail"].lower()
    )


def test_admin_update_nonexistent_user(client: TestClient, admin_token_headers):
    res = client.put(
        "/api/admin/users/999999",
        headers=admin_token_headers,
        json={"full_name": "Ghost User"},
    )
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_admin_create_user_with_sales_rep_and_validation(
    client: TestClient, admin_token_headers
):
    uid = uuid.uuid4().hex[:8]

    # Invalid role_id on create -> 400
    bad_res = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"create_bad_{uid}@hospital.co.za",
            "username": f"create_bad_{uid}",
            "password": "Password123!",
            "role_id": 99999,
        },
    )
    assert bad_res.status_code == 400
    assert "does not exist" in bad_res.json()["detail"].lower()

    # Invalid permission section on create -> 400
    bad_perm_res = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"create_bad2_{uid}@hospital.co.za",
            "username": f"create_bad2_{uid}",
            "password": "Password123!",
            "custom_permissions": {"invalid_section": "read"},
        },
    )
    assert bad_perm_res.status_code == 400
    assert "invalid permission section" in bad_perm_res.json()["detail"].lower()

    # Valid create with sales_rep role and custom permissions
    good_res = client.post(
        "/api/admin/users",
        headers=admin_token_headers,
        json={
            "email": f"sales_new_{uid}@hospital.co.za",
            "username": f"sales_new_{uid}",
            "password": "Password123!",
            "role": "sales_rep",
            "custom_permissions": {"content": "read"},
        },
    )
    assert good_res.status_code == 201
    created = good_res.json()
    assert created["role"] == "sales_rep"
    assert created["role_name"] == "Sales Representative"
    assert created["has_custom_permissions"] is True
    assert created["permissions"]["content"] == "read"
