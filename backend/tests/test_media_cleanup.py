import os

from app.services.storage import get_storage_service
from starlette.testclient import TestClient


def _get_local_disk_path(url: str) -> str:
    storage = get_storage_service()
    clean_path = url.lstrip("/")
    if clean_path.startswith("media/"):
        clean_path = clean_path[len("media/") :]
    return os.path.join(storage.base_dir, clean_path)


def test_product_update_removes_old_brochure(client: TestClient, admin_token_headers):
    # 1. Upload initial brochure
    pdf_1 = b"%PDF-1.4 Brochure One"
    res1 = client.post(
        "/api/products/upload-brochure",
        files={"file": ("brochure_v1.pdf", pdf_1, "application/pdf")},
        headers=admin_token_headers,
    )
    assert res1.status_code == 200
    url1 = res1.json()["url"]
    disk_path1 = _get_local_disk_path(url1)
    assert os.path.exists(disk_path1), f"Expected file {disk_path1} to exist on disk"

    # 2. Create product with this brochure
    create_res = client.post(
        "/api/products",
        json={
            "name": "Auto Defibrillator V1",
            "sku": "DEFIB-V1-CLEANUP",
            "brochure_url": url1,
        },
        headers=admin_token_headers,
    )
    assert create_res.status_code == 201
    prod_id = create_res.json()["id"]

    # 3. Upload replacement brochure
    pdf_2 = b"%PDF-1.4 Brochure Two Replacement"
    res2 = client.post(
        "/api/products/upload-brochure",
        files={"file": ("brochure_v2.pdf", pdf_2, "application/pdf")},
        headers=admin_token_headers,
    )
    assert res2.status_code == 200
    url2 = res2.json()["url"]
    disk_path2 = _get_local_disk_path(url2)
    assert os.path.exists(disk_path2)

    # 4. Update product with new brochure URL
    update_res = client.put(
        f"/api/products/{prod_id}",
        json={"brochure_url": url2},
        headers=admin_token_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["brochure_url"] == url2

    # 5. Verify old brochure was physically removed from media folder
    assert not os.path.exists(
        disk_path1
    ), "Old brochure file should be deleted from disk"
    assert os.path.exists(disk_path2), "New brochure file should remain on disk"

    # Clean up product
    client.delete(f"/api/products/{prod_id}", headers=admin_token_headers)
    assert not os.path.exists(
        disk_path2
    ), "Brochure 2 should be deleted when product is deleted"


def test_product_update_removes_deleted_image(client: TestClient, admin_token_headers):
    # 1. Upload two images
    img_data_1 = b"\x89PNG\r\n\x1a\nIMG1"
    img_data_2 = b"\x89PNG\r\n\x1a\nIMG2"

    u1 = client.post(
        "/api/products/upload-image",
        files={"file": ("device_photo_1.png", img_data_1, "image/png")},
        headers=admin_token_headers,
    ).json()["url"]
    u2 = client.post(
        "/api/products/upload-image",
        files={"file": ("device_photo_2.png", img_data_2, "image/png")},
        headers=admin_token_headers,
    ).json()["url"]

    path1 = _get_local_disk_path(u1)
    path2 = _get_local_disk_path(u2)
    assert os.path.exists(path1)
    assert os.path.exists(path2)

    # 2. Create product with both images
    create_res = client.post(
        "/api/products",
        json={
            "name": "Infusion Pump X",
            "sku": "PUMP-X-CLEANUP",
            "images": [
                {"image_url": u1, "is_primary": True},
                {"image_url": u2, "is_primary": False},
            ],
        },
        headers=admin_token_headers,
    )
    assert create_res.status_code == 201
    prod_id = create_res.json()["id"]

    # 3. Update product keeping only image 2 (removing image 1)
    update_res = client.put(
        f"/api/products/{prod_id}",
        json={
            "images": [
                {"image_url": u2, "is_primary": True},
            ],
        },
        headers=admin_token_headers,
    )
    assert update_res.status_code == 200

    # 4. Verify removed image 1 is deleted from disk, image 2 remains
    assert not os.path.exists(path1), "Removed image file 1 should be deleted from disk"
    assert os.path.exists(path2), "Remaining image file 2 should stay on disk"

    # Clean up
    client.delete(f"/api/products/{prod_id}", headers=admin_token_headers)
    assert not os.path.exists(path2), "Image 2 should be deleted on product deletion"


def test_shared_media_file_not_deleted_if_used_by_another_entity(
    client: TestClient, admin_token_headers
):
    # 1. Upload shared image
    img_data = b"\x89PNG\r\n\x1a\nSHARED_IMG"
    shared_url = client.post(
        "/api/products/upload-image",
        files={"file": ("shared_monitor.png", img_data, "image/png")},
        headers=admin_token_headers,
    ).json()["url"]
    shared_disk_path = _get_local_disk_path(shared_url)
    assert os.path.exists(shared_disk_path)

    # 2. Create Product 1 and Product 2 both using shared_url
    p1_id = client.post(
        "/api/products",
        json={
            "name": "Bedside Monitor Alpha",
            "sku": "MON-ALPHA-SHARED",
            "images": [{"image_url": shared_url, "is_primary": True}],
        },
        headers=admin_token_headers,
    ).json()["id"]

    p2_id = client.post(
        "/api/products",
        json={
            "name": "Bedside Monitor Beta",
            "sku": "MON-BETA-SHARED",
            "images": [{"image_url": shared_url, "is_primary": True}],
        },
        headers=admin_token_headers,
    ).json()["id"]

    # 3. Delete Product 1
    del1 = client.delete(f"/api/products/{p1_id}", headers=admin_token_headers)
    assert del1.status_code == 200

    # 4. Verify shared file was NOT deleted because Product 2 still uses it!
    assert os.path.exists(
        shared_disk_path
    ), "Shared media should be kept while other products use it"

    # 5. Delete Product 2
    del2 = client.delete(f"/api/products/{p2_id}", headers=admin_token_headers)
    assert del2.status_code == 200

    # 6. Now that no one uses it, the file should be deleted
    assert not os.path.exists(
        shared_disk_path
    ), "Media should be deleted when last referencing product is removed"


def test_brand_logo_cleanup_on_update_and_delete(
    client: TestClient, admin_token_headers
):
    # 1. Upload brand logo 1
    logo1_bytes = b"\x89PNG\r\n\x1a\nBRAND_LOGO_1"
    res1 = client.post(
        "/api/brands/upload-logo",
        files={"file": ("brand_logo_1.png", logo1_bytes, "image/png")},
        headers=admin_token_headers,
    )
    assert res1.status_code == 200
    logo1_url = res1.json()["url"]
    logo1_path = _get_local_disk_path(logo1_url)
    assert os.path.exists(logo1_path)

    # 2. Create Brand
    brand_res = client.post(
        "/api/brands",
        json={"name": "BioTech Innovations", "logo_url": logo1_url},
        headers=admin_token_headers,
    )
    assert brand_res.status_code == 201
    brand_id = brand_res.json()["id"]

    # 3. Upload brand logo 2
    logo2_bytes = b"\x89PNG\r\n\x1a\nBRAND_LOGO_2"
    res2 = client.post(
        "/api/brands/upload-logo",
        files={"file": ("brand_logo_2.png", logo2_bytes, "image/png")},
        headers=admin_token_headers,
    )
    assert res2.status_code == 200
    logo2_url = res2.json()["url"]
    logo2_path = _get_local_disk_path(logo2_url)
    assert os.path.exists(logo2_path)

    # 4. Update brand with logo 2
    update_res = client.put(
        f"/api/brands/{brand_id}",
        json={"logo_url": logo2_url},
        headers=admin_token_headers,
    )
    assert update_res.status_code == 200

    # Logo 1 should be deleted from media folder
    assert not os.path.exists(logo1_path), "Old brand logo should be deleted from disk"
    assert os.path.exists(logo2_path), "New brand logo should remain on disk"

    # 5. Delete brand
    del_brand = client.delete(f"/api/brands/{brand_id}", headers=admin_token_headers)
    assert del_brand.status_code == 200

    # Logo 2 should now be deleted from media folder
    assert not os.path.exists(
        logo2_path
    ), "Brand logo should be deleted on brand deletion"


def test_explicit_delete_media_endpoint(client: TestClient, admin_token_headers):
    # 1. Upload a file
    pdf_bytes = b"%PDF-1.4 Standalone Document"
    res = client.post(
        "/api/products/upload-brochure",
        files={"file": ("standalone_brochure.pdf", pdf_bytes, "application/pdf")},
        headers=admin_token_headers,
    )
    assert res.status_code == 200
    file_url = res.json()["url"]
    disk_path = _get_local_disk_path(file_url)
    assert os.path.exists(disk_path)

    # 2. Associate with product
    prod_res = client.post(
        "/api/products",
        json={
            "name": "Ventilator Model 9",
            "sku": "VENT-9-STANDALONE",
            "brochure_url": file_url,
        },
        headers=admin_token_headers,
    )
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # 3. Attempt to delete without force -> should return 409 Conflict
    del_conflict = client.delete(
        f"/api/products/media?file_url={file_url}",
        headers=admin_token_headers,
    )
    assert del_conflict.status_code == 409
    assert os.path.exists(disk_path)

    # 4. Delete with force=true -> should succeed
    del_force = client.delete(
        f"/api/products/media?file_url={file_url}&force=true",
        headers=admin_token_headers,
    )
    assert del_force.status_code == 200
    assert not os.path.exists(disk_path)

    # Clean up test product
    client.delete(f"/api/products/{prod_id}", headers=admin_token_headers)
