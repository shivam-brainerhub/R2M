import io
import pytest
from starlette.testclient import TestClient
from app.models import Product, Property


def test_list_products_public(client: TestClient):
    res = client.get("/api/products")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 4  # Seed products
    first = data[0]
    assert "name" in first
    assert "slug" in first
    assert "primary_image_url" in first
    assert "images" in first
    assert "properties" in first
    assert "status" in first


def test_get_product_by_slug_seo(client: TestClient):
    # Lookup by SEO slug
    res = client.get("/api/products/benevision-n12")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "BeneVision N12"
    assert data["slug"] == "benevision-n12"
    assert data["sku"] == "MN-N12-001"
    assert data["brand_name"] == "Mindray"
    assert len(data["images"]) >= 1
    assert data["images"][0]["is_primary"] is True
    assert len(data["properties"]) >= 5
    # Verify specs dict
    assert "Display Size" in data["specifications"]


def test_get_product_by_id(client: TestClient):
    list_res = client.get("/api/products")
    product_id = list_res.json()[0]["id"]

    res = client.get(f"/api/products/{product_id}")
    assert res.status_code == 200
    assert res.json()["id"] == product_id


def test_get_product_not_found(client: TestClient):
    res = client.get("/api/products/non-existent-product-slug-xyz")
    assert res.status_code == 404


def test_compare_products_by_slug(client: TestClient):
    res = client.get("/api/products/compare?items=benevision-n12,intellivue-mx450")
    assert res.status_code == 200
    data = res.json()
    assert "products" in data
    assert "properties" in data
    assert len(data["products"]) == 2

    # Check property alignment
    display_row = next((p for p in data["properties"] if p["name"] == "Display Size"), None)
    assert display_row is not None
    assert display_row["values"]["benevision-n12"] == '12.1" Touchscreen'
    assert display_row["values"]["intellivue-mx450"] == '12.0" Touchscreen'


def test_product_catalogue_stats(client: TestClient):
    res = client.get("/api/products/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_products"] >= 4
    assert data["active_products"] >= 4
    assert data["with_brochure_count"] >= 4
    assert data["total_brands"] >= 4
    assert data["total_properties"] >= 5
    assert "Diagnostic and Measure" in data["category_distribution"]
    assert "Mindray" in data["brand_distribution"]


def test_create_product_admin_with_dynamic_properties_and_images(
    client: TestClient, admin_token_headers
):
    payload = {
        "name": "Defigard 4000 Defibrillator",
        "sku": "DG-4000-NEW",
        "description": "Biphasic defibrillator with synchronized cardioversion.",
        "short_description": "Compact biphasic hospital defibrillator.",
        "brochure_url": "/brochures/defigard_4000.pdf",
        "status": "Active",
        "images": [
            {
                "image_url": "/images/defigard_front.jpg",
                "alt_text": "Defigard 4000 Front",
                "is_primary": True,
                "display_order": 0,
            },
            {
                "image_url": "/images/defigard_side.jpg",
                "alt_text": "Defigard 4000 Side",
                "is_primary": False,
                "display_order": 1,
            },
        ],
        "properties": [
            {"name": "Display Size", "value": '5.7" High Contrast LCD'},
            {"name": "Energy Levels", "value": "2 to 200 Joules Multipulse Biowave"},
            {"name": "Pacing Mode", "value": "Transcutaneous pacing supported"},
        ],
    }

    res = client.post("/api/products", json=payload, headers=admin_token_headers)
    assert res.status_code == 201
    created = res.json()
    assert created["name"] == "Defigard 4000 Defibrillator"
    assert created["slug"] == "defigard-4000-defibrillator"
    assert created["sku"] == "DG-4000-NEW"
    assert len(created["images"]) == 2
    assert created["primary_image_url"] == "/images/defigard_front.jpg"
    assert len(created["properties"]) == 3

    # Verify that new properties ('Energy Levels', 'Pacing Mode') were created dynamically!
    prop_names = [p["name"] for p in created["properties"]]
    assert "Energy Levels" in prop_names
    assert "Pacing Mode" in prop_names


def test_create_product_unauthorized(client: TestClient):
    res = client.post("/api/products", json={"name": "Unauthorized Product"})
    assert res.status_code == 401


def test_create_product_forbidden_regular_user(client: TestClient, user_token_headers):
    res = client.post(
        "/api/products",
        json={"name": "Forbidden Product"},
        headers=user_token_headers,
    )
    assert res.status_code == 403


def test_update_and_toggle_status_and_delete_product(
    client: TestClient, admin_token_headers
):
    # 1. Create a product to update and delete
    create_payload = {
        "name": "Temp Test Monitor",
        "sku": "TTM-999-TEMP",
        "status": "Active",
    }
    create_res = client.post("/api/products", json=create_payload, headers=admin_token_headers)
    assert create_res.status_code == 201
    prod_id = create_res.json()["id"]

    # 2. Toggle status
    toggle_res = client.post(
        f"/api/products/{prod_id}/toggle-status", headers=admin_token_headers
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["status"] == "Draft"

    toggle_back = client.post(
        f"/api/products/{prod_id}/toggle-status", headers=admin_token_headers
    )
    assert toggle_back.status_code == 200
    assert toggle_back.json()["status"] == "Active"

    # 3. Update details
    update_res = client.put(
        f"/api/products/{prod_id}",
        json={
            "description": "Updated medical description",
            "brochure_url": "/brochures/updated.pdf",
            "properties": [
                {"name": "Display Size", "value": '15.6" Full HD'},
                {"name": "Battery Life", "value": "6 hours"},
            ],
        },
        headers=admin_token_headers,
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["description"] == "Updated medical description"
    assert updated["brochure_url"] == "/brochures/updated.pdf"
    assert len(updated["properties"]) == 2

    # 4. Delete product
    del_res = client.delete(f"/api/products/{prod_id}", headers=admin_token_headers)
    assert del_res.status_code == 200

    # Verify not found
    get_res = client.get(f"/api/products/{prod_id}")
    assert get_res.status_code == 404


def test_upload_brochure_and_image(
    client: TestClient, admin_token_headers, user_token_headers
):
    # 1. Brochure upload unauthorized / forbidden checks
    pdf_content = b"%PDF-1.4 sample brochure pdf bytes"
    unauth_res = client.post(
        "/api/products/upload-brochure",
        files={"file": ("brochure.pdf", pdf_content, "application/pdf")},
    )
    assert unauth_res.status_code == 401

    forbidden_res = client.post(
        "/api/products/upload-brochure",
        files={"file": ("brochure.pdf", pdf_content, "application/pdf")},
        headers=user_token_headers,
    )
    assert forbidden_res.status_code == 403

    # 2. Admin brochure upload
    brochure_res = client.post(
        "/api/products/upload-brochure",
        files={"file": ("medical_brochure.pdf", pdf_content, "application/pdf")},
        headers=admin_token_headers,
    )
    assert brochure_res.status_code == 200
    b_data = brochure_res.json()
    assert "url" in b_data
    assert b_data["url"].startswith("/media/brochures/")
    assert b_data["url"].endswith(".pdf")

    # 3. Admin product image upload
    img_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    img_res = client.post(
        "/api/products/upload-image",
        files={"file": ("device_photo.png", img_content, "image/png")},
        headers=admin_token_headers,
    )
    assert img_res.status_code == 200
    img_data = img_res.json()
    assert "url" in img_data
    assert img_data["url"].startswith("/media/products/")
    assert img_data["url"].endswith(".png")


def test_properties_crud_endpoints(client: TestClient, admin_token_headers):
    # 1. List properties
    res = client.get("/api/properties")
    assert res.status_code == 200
    props = res.json()
    assert isinstance(props, list)
    assert len(props) >= 5

    # 2. Create standalone property
    create_res = client.post(
        "/api/properties",
        json={"name": "Laser Wavelength", "group": "Optical"},
        headers=admin_token_headers,
    )
    assert create_res.status_code == 201
    prop_id = create_res.json()["id"]
    assert create_res.json()["name"] == "Laser Wavelength"

    # 3. Duplicate name returns 400
    dup_res = client.post(
        "/api/properties",
        json={"name": "Laser Wavelength"},
        headers=admin_token_headers,
    )
    assert dup_res.status_code == 400

    # 4. Update property
    update_res = client.put(
        f"/api/properties/{prop_id}",
        json={"name": "Optical Laser Wavelength", "group": "Optics & Lasers"},
        headers=admin_token_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Optical Laser Wavelength"
    assert update_res.json()["group"] == "Optics & Lasers"

    # 4b. Clear group by sending empty string or null
    clear_group_res = client.put(
        f"/api/properties/{prop_id}",
        json={"name": "Optical Laser Wavelength", "group": ""},
        headers=admin_token_headers,
    )
    assert clear_group_res.status_code == 200
    assert clear_group_res.json()["group"] is None


    # 5. Delete property
    del_res = client.delete(f"/api/properties/{prop_id}", headers=admin_token_headers)
    assert del_res.status_code == 200

    # Verify not found
    get_res = client.get(f"/api/properties/{prop_id}")
    assert get_res.status_code == 404


def test_get_product_filters_endpoint(client: TestClient):
    res = client.get("/api/products/filters")
    assert res.status_code == 200
    data = res.json()
    assert "total_products" in data
    assert "categories" in data
    assert "brands" in data
    assert "properties" in data
    assert "availability" in data

    # Verify total products and availability
    assert data["total_products"] >= 4
    assert data["availability"]["active_count"] == data["total_products"]
    assert data["availability"]["brochure_count"] >= 4

    # Verify categories structure
    assert len(data["categories"]) > 0
    cat = data["categories"][0]
    assert "id" in cat
    assert "name" in cat
    assert "slug" in cat
    assert "product_count" in cat
    assert "subcategories" in cat

    # Verify brands structure
    assert len(data["brands"]) > 0
    brand = data["brands"][0]
    assert "id" in brand
    assert "name" in brand
    assert "count" in brand
    assert brand["count"] >= 0

    # Verify dynamic properties structure
    assert len(data["properties"]) > 0
    prop = data["properties"][0]
    assert "name" in prop
    assert "options" in prop
    assert len(prop["options"]) > 0
    assert "value" in prop["options"][0]
    assert "count" in prop["options"][0]


def test_product_lifecycle_updates_filter_cache_in_background(
    client: TestClient, admin_token_headers
):
    # Fetch initial filter options
    init_res = client.get("/api/products/filters")
    assert init_res.status_code == 200
    init_total = init_res.json()["total_products"]

    # 1. Add new product
    payload = {
        "name": "Auto Cache Test Monitor",
        "sku": "CACHE-TEST-001",
        "status": "Active",
        "brochure_url": "/brochures/cache_test.pdf",
        "properties": [
            {"name": "Screen Resolution", "value": "4K UltraHD", "group": "Display"},
        ],
    }
    create_res = client.post("/api/products", json=payload, headers=admin_token_headers)
    assert create_res.status_code == 201
    prod_id = create_res.json()["id"]

    # Fast check: filters endpoint should now reflect updated counts
    res_after_add = client.get("/api/products/filters")
    assert res_after_add.status_code == 200
    assert res_after_add.json()["total_products"] == init_total + 1
    # Check that new dynamic property "Screen Resolution" with "4K UltraHD" exists
    res_prop = next(
        (p for p in res_after_add.json()["properties"] if p["name"] == "Screen Resolution"),
        None,
    )
    assert res_prop is not None
    assert any(opt["value"] == "4K UltraHD" for opt in res_prop["options"])

    # 2. Toggle status to Draft (inactive) -> should decrement active total
    toggle_res = client.post(
        f"/api/products/{prod_id}/toggle-status",
        headers=admin_token_headers,
    )
    assert toggle_res.status_code == 200
    assert toggle_res.json()["status"] == "Draft"

    res_after_draft = client.get("/api/products/filters")
    assert res_after_draft.status_code == 200
    assert res_after_draft.json()["total_products"] == init_total

    # 3. Delete product
    del_res = client.delete(f"/api/products/{prod_id}", headers=admin_token_headers)
    assert del_res.status_code == 200

    res_after_del = client.get("/api/products/filters")
    assert res_after_del.status_code == 200
    assert res_after_del.json()["total_products"] == init_total


def test_get_related_products(client: TestClient):
    res = client.get("/api/products/benevision-n12/related?limit=4")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    # The reference product itself must not be in the results
    slugs = [p["slug"] for p in data]
    assert "benevision-n12" not in slugs
    # All returned products must be Active
    for p in data:
        assert p["status"] == "Active"


def test_get_related_products_by_id(client: TestClient):
    # Lookup first product's id
    list_res = client.get("/api/products")
    first_product = list_res.json()[0]
    prod_id = first_product["id"]

    res = client.get(f"/api/products/{prod_id}/related?limit=3")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert all(p["id"] != prod_id for p in data)


def test_get_related_products_not_found(client: TestClient):
    res = client.get("/api/products/completely-unknown-slug/related")
    assert res.status_code == 404


