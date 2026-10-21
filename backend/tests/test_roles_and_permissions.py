from app.core.security import create_access_token, get_password_hash
from app.models import Role, User


def test_regular_user_cannot_access_roles(client, user_token_headers):
    response = client.get("/api/admin/roles", headers=user_token_headers)
    assert response.status_code == 403
    assert "Admin privileges required" in response.json()["detail"]


def test_admin_list_roles(client, admin_token_headers):
    response = client.get("/api/admin/roles", headers=admin_token_headers)
    assert response.status_code == 200
    roles = response.json()
    assert len(roles) >= 6
    slugs = [r["slug"] for r in roles]
    assert "admin" in slugs
    assert "user" in slugs
    assert "sales_rep" in slugs
    assert "product_manager" in slugs


def test_admin_create_update_delete_custom_role(client, admin_token_headers):
    # 1. Create custom role
    create_payload = {
        "name": "Procurement Officer",
        "description": "Reviews tender quotes and supplier applications",
        "permissions": {
            "quotes": "read_write",
            "products": "read",
            "categories": "read",
            "inquiries": "read_write",
            "content": "none",
            "users": "none",
            "roles": "none",
        },
    }
    create_res = client.post(
        "/api/admin/roles", json=create_payload, headers=admin_token_headers
    )
    assert create_res.status_code == 201
    created_role = create_res.json()
    assert created_role["name"] == "Procurement Officer"
    assert created_role["slug"] == "procurement_officer"
    assert created_role["is_system"] is False
    assert created_role["permissions"]["quotes"] == "read_write"
    role_id = created_role["id"]

    # 2. Get by ID
    get_res = client.get(f"/api/admin/roles/{role_id}", headers=admin_token_headers)
    assert get_res.status_code == 200
    assert get_res.json()["slug"] == "procurement_officer"

    # 3. Update role permissions
    update_payload = {
        "description": "Updated description",
        "permissions": {
            "quotes": "read",
        },
    }
    update_res = client.put(
        f"/api/admin/roles/{role_id}", json=update_payload, headers=admin_token_headers
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["description"] == "Updated description"
    assert updated["permissions"]["quotes"] == "read"

    # 4. Delete role
    del_res = client.delete(f"/api/admin/roles/{role_id}", headers=admin_token_headers)
    assert del_res.status_code == 200
    assert "deleted successfully" in del_res.json()["message"]


def test_cannot_delete_system_role(client, admin_token_headers):
    # Fetch admin role
    roles_res = client.get("/api/admin/roles", headers=admin_token_headers)
    admin_role = next(r for r in roles_res.json() if r["slug"] == "admin")

    del_res = client.delete(
        f"/api/admin/roles/{admin_role['id']}", headers=admin_token_headers
    )
    assert del_res.status_code == 400
    assert "System roles cannot be deleted" in del_res.json()["detail"]


def test_granular_permissions_enforcement(client, db_session, admin_token_headers):
    # Create a staff user with sales_rep role (read_write quotes, read products, none users)
    sales_role = db_session.query(Role).filter(Role.slug == "sales_rep").first()

    sales_user = User(
        email="sales_rep_test@hospital.co.za",
        username="sales_rep_test",
        full_name="Sales Rep User",
        hashed_password=get_password_hash("Password123!"),
        role="sales_rep",
        role_id=sales_role.id if sales_role else None,
        is_active=True,
        is_email_verified=True,
    )
    db_session.add(sales_user)
    db_session.commit()
    db_session.refresh(sales_user)

    sales_token = create_access_token(subject=sales_user.id, role="sales_rep")
    sales_headers = {"Authorization": f"Bearer {sales_token}"}

    # 1. Sales rep CAN access quote stats (quotes: read_write)
    res_quotes = client.get("/api/quotes/stats", headers=sales_headers)
    assert res_quotes.status_code == 200

    # 2. Sales rep CAN view products (products: read)
    res_prods = client.get("/api/products", headers=sales_headers)
    assert res_prods.status_code == 200

    # 3. Sales rep CANNOT create products (products: write required)
    res_create_prod = client.post(
        "/api/products", json={"name": "Forbidden Device"}, headers=sales_headers
    )
    assert res_create_prod.status_code == 403
    assert (
        "insufficient permissions" in res_create_prod.json()["detail"].lower()
        or "do not have permission" in res_create_prod.json()["detail"].lower()
    )

    # 4. Sales rep CANNOT access user management (users: none)
    res_users = client.get("/api/admin/users", headers=sales_headers)
    assert res_users.status_code == 403

    # 5. Sales rep CANNOT access roles (roles: none & admin required)
    res_roles = client.get("/api/admin/roles", headers=sales_headers)
    assert res_roles.status_code == 403

    # Clean up test user
    db_session.delete(sales_user)
    db_session.commit()


def test_user_permission_override(client, db_session):
    # Create user with custom_permissions override
    # User has role="support", but has custom override granting content: "read_write"
    support_role = db_session.query(Role).filter(Role.slug == "support").first()

    custom_user = User(
        email="custom_support@hospital.co.za",
        username="custom_support",
        full_name="Custom Support User",
        hashed_password=get_password_hash("Password123!"),
        role="support",
        role_id=support_role.id if support_role else None,
        custom_permissions={
            "content": "read_write",
        },
        is_active=True,
        is_email_verified=True,
    )
    db_session.add(custom_user)
    db_session.commit()
    db_session.refresh(custom_user)

    user_token = create_access_token(subject=custom_user.id, role="support")
    headers = {"Authorization": f"Bearer {user_token}"}

    # Verify /api/auth/me returns effective permissions including the override
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["permissions"]["content"] == "read_write"
    assert me_data["has_custom_permissions"] is True

    # User can now update site content thanks to the override
    content_res = client.put(
        "/api/content/hero",
        json={
            "title": "Custom Test Hero",
            "content": {"headline_part1": "Healthcare Updated"},
        },
        headers=headers,
    )
    assert content_res.status_code == 200

    # Clean up user and restore hero content
    db_session.delete(custom_user)
    db_session.commit()
    client.put(
        "/api/content/hero",
        json={
            "title": "Homepage Hero & Search",
            "content": {"headline_part1": "Healthcare", "headline_part2": "without"},
        },
        headers=headers,
    )


def test_user_management_granular_permissions(client, db_session, admin_token_headers):
    # 1. Create a user with users: read permission only
    reader_user = User(
        email="users_reader@hospital.co.za",
        username="users_reader",
        full_name="Users Reader",
        hashed_password=get_password_hash("Password123!"),
        role="custom_staff",
        custom_permissions={"users": "read"},
        is_active=True,
        is_email_verified=True,
    )
    # 2. Create a user with users: read_write permission
    writer_user = User(
        email="users_writer@hospital.co.za",
        username="users_writer",
        full_name="Users Writer",
        hashed_password=get_password_hash("Password123!"),
        role="custom_staff",
        custom_permissions={"users": "read_write"},
        is_active=True,
        is_email_verified=True,
    )
    db_session.add_all([reader_user, writer_user])
    db_session.commit()
    db_session.refresh(reader_user)
    db_session.refresh(writer_user)

    reader_token = create_access_token(subject=reader_user.id, role="custom_staff")
    writer_token = create_access_token(subject=writer_user.id, role="custom_staff")
    reader_headers = {"Authorization": f"Bearer {reader_token}"}
    writer_headers = {"Authorization": f"Bearer {writer_token}"}

    # Reader CAN list users
    res_list = client.get("/api/admin/users", headers=reader_headers)
    assert res_list.status_code == 200

    # Reader CANNOT create user
    res_create_forbidden = client.post(
        "/api/admin/users",
        headers=reader_headers,
        json={
            "email": "forbidden_create@test.co.za",
            "username": "forbidden_create",
            "password": "Password123!",
            "role": "user",
        },
    )
    assert res_create_forbidden.status_code == 403
    assert "users (write required)" in res_create_forbidden.json()["detail"].lower()

    # Writer CAN create normal user
    res_create_ok = client.post(
        "/api/admin/users",
        headers=writer_headers,
        json={
            "email": "writer_created@test.co.za",
            "username": "writer_created",
            "password": "Password123!",
            "role": "user",
        },
    )
    assert res_create_ok.status_code == 201
    created_id = res_create_ok.json()["id"]

    # Writer CANNOT create admin user
    res_create_admin_forbidden = client.post(
        "/api/admin/users",
        headers=writer_headers,
        json={
            "email": "writer_admin_create@test.co.za",
            "username": "writer_admin_create",
            "password": "Password123!",
            "role": "admin",
        },
    )
    assert res_create_admin_forbidden.status_code == 403
    assert "administrators" in res_create_admin_forbidden.json()["detail"].lower()

    # Writer CANNOT modify an admin account
    admin_user = db_session.query(User).filter(User.role == "admin").first()
    if admin_user:
        res_edit_admin = client.put(
            f"/api/admin/users/{admin_user.id}",
            headers=writer_headers,
            json={"full_name": "Hacked Admin"},
        )
        assert res_edit_admin.status_code == 403
        assert "administrators" in res_edit_admin.json()["detail"].lower()

    # Clean up test accounts
    client.delete(f"/api/admin/users/{created_id}", headers=admin_token_headers)
    db_session.delete(reader_user)
    db_session.delete(writer_user)
    db_session.commit()
