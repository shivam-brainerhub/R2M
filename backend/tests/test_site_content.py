import io


def test_get_all_site_content_public(client):
    response = client.get("/api/content")
    assert response.status_code == 200
    data = response.json()
    assert "hero" in data
    assert "company" in data
    assert "why_us" in data
    assert "cta" in data
    assert "headline_part1" in data["hero"] or "headlinePart1" in data["hero"]
    assert "company_name" in data["company"] or "companyName" in data["company"]


def test_get_specific_section_public(client):
    response = client.get("/api/content/hero")
    assert response.status_code == 200
    data = response.json()
    assert data["key"] == "hero"
    assert "content" in data
    assert "Healthcare" in str(data["content"])


def test_get_nonexistent_section_404(client):
    response = client.get("/api/content/nonexistent_section_key")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_update_section_unauthenticated(client):
    response = client.put(
        "/api/content/hero",
        json={"content": {"headline_part1": "New Headline"}},
    )
    assert response.status_code == 401


def test_update_section_forbidden_for_regular_user(client, user_token_headers):
    response = client.put(
        "/api/content/hero",
        json={"content": {"headline_part1": "New Headline"}},
        headers=user_token_headers,
    )
    assert response.status_code == 403


def test_admin_update_hero_section(client, admin_token_headers):
    updated_payload = {
        "title": "Homepage Hero & Search",
        "content": {
            "headlinePart1": "Innovative",
            "headlinePart2": "Healthcare",
            "headlineAccent": "Everywhere.",
            "subheading": "Updated subtitle for digital catalogue testing.",
            "showSearchBar": False,
            "popularSearches": ["Ultrasound", "Ventilator"],
        },
    }
    response = client.put(
        "/api/content/hero",
        json=updated_payload,
        headers=admin_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["key"] == "hero"
    assert data["content"]["headlinePart1"] == "Innovative"
    assert data["content"]["headline_part1"] == "Innovative"
    assert data["content"]["showSearchBar"] is False
    assert data["content"]["show_search_bar"] is False

    # Verify persisted via GET
    get_res = client.get("/api/content/hero")
    assert get_res.status_code == 200
    assert get_res.json()["content"]["headlinePart1"] == "Innovative"
    assert get_res.json()["content"]["showSearchBar"] is False


def test_admin_update_company_section(client, admin_token_headers):
    updated_payload = {
        "title": "Contact & Company Info",
        "content": {
            "companyName": "SA Healthcare Systems",
            "phone": "+27 11 999 0000",
            "tollFree": "0800 999 888",
            "email": "contact@sahealthcare.com",
            "salesEmail": "sales@sahealthcare.com",
            "physicalAddress": "50 Hospital Rd, Pretoria",
            "hours": "Mon-Fri 07:00 - 18:00",
        },
    }
    response = client.put(
        "/api/content/company",
        json=updated_payload,
        headers=admin_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["key"] == "company"
    assert data["content"]["companyName"] == "SA Healthcare Systems"
    assert data["content"]["phone"] == "+27 11 999 0000"


def test_admin_batch_update(client, admin_token_headers):
    batch_payload = {
        "sections": {
            "hero": {
                "headlinePart1": "Batch",
                "headlinePart2": "Updated",
                "headlineAccent": "Now.",
                "subheading": "Batch testing",
                "showSearchBar": True,
            },
            "cta": {
                "heading": "Batch CTA Heading",
                "subheading": "Batch CTA Subheading",
                "buttonText": "Inquire Today",
            },
        }
    }
    response = client.post(
        "/api/content/batch",
        json=batch_payload,
        headers=admin_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["hero"]["headlinePart1"] == "Batch"
    assert data["cta"]["heading"] == "Batch CTA Heading"


def test_admin_reset_section(client, admin_token_headers):
    # Reset hero section
    response = client.post(
        "/api/content/reset?key=hero",
        headers=admin_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["hero"]["headlinePart1"] == "Healthcare"
    assert data["hero"]["showSearchBar"] is True


def test_admin_upload_content_image(client, admin_token_headers):
    file_bytes = b"fake-png-content"
    file = io.BytesIO(file_bytes)
    response = client.post(
        "/api/content/upload-image",
        files={"file": ("test_banner.png", file, "image/png")},
        headers=admin_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "test_banner" in data["filename"]


def test_get_privacy_policy_and_terms_public(client):
    response = client.get("/api/content")
    assert response.status_code == 200
    data = response.json()
    assert "privacy_policy" in data
    assert "terms_of_use" in data
    assert data["privacy_policy"]["title"] == "Privacy Policy"
    assert data["terms_of_use"]["title"] == "Terms of Use"
    assert "content" in data["privacy_policy"]
    assert "Commitment to Privacy" in data["privacy_policy"]["content"]
    assert "content" in data["terms_of_use"]
    assert "Acceptance of Terms" in data["terms_of_use"]["content"]

    # Specific endpoints
    priv_res = client.get("/api/content/privacy_policy")
    assert priv_res.status_code == 200
    assert priv_res.json()["key"] == "privacy_policy"
    assert "Commitment to Privacy" in str(priv_res.json()["content"])

    terms_res = client.get("/api/content/terms_of_use")
    assert terms_res.status_code == 200
    assert terms_res.json()["key"] == "terms_of_use"
    assert "Acceptance of Terms" in str(terms_res.json()["content"])


def test_admin_update_privacy_policy(client, admin_token_headers):
    updated_payload = {
        "title": "Privacy Policy",
        "content": {
            "title": "Privacy Policy",
            "subtitle": "Updated POPIA Privacy Notice for Healthcare Clients",
            "lastUpdated": "November 2026",
            "content": "<h2>1. Updated Privacy Notice</h2><p>Updated content describing patient and client privacy.</p>",
        },
    }
    response = client.put(
        "/api/content/privacy_policy",
        json=updated_payload,
        headers=admin_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert (
        data["content"]["subtitle"]
        == "Updated POPIA Privacy Notice for Healthcare Clients"
    )
    assert data["content"]["lastUpdated"] == "November 2026"
    assert "Updated content describing patient" in data["content"]["content"]


def test_get_products_page_public(client):
    response = client.get("/api/content/products_page")
    assert response.status_code == 200
    data = response.json()
    assert data["key"] == "products_page"
    assert "content" in data
    assert data["content"]["title"] == "Browse the Catalogue"
    assert "popularSearches" in data["content"]
    assert len(data["content"]["popularSearches"]) > 0


def test_admin_update_products_page(client, admin_token_headers):
    updated_payload = {
        "title": "Product Catalogue Search",
        "content": {
            "title": "Specialized Medical Equipment Catalogue",
            "subtitle": "Discover world-class healthcare tools.",
            "searchPlaceholder": "Search diagnostics, monitors, MRI...",
            "popularSearches": ["MRI Scanner", "Surgical Table", "Endoscope"],
        },
    }
    response = client.put(
        "/api/content/products_page",
        json=updated_payload,
        headers=admin_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"]["title"] == "Specialized Medical Equipment Catalogue"
    assert (
        data["content"]["searchPlaceholder"] == "Search diagnostics, monitors, MRI..."
    )
    assert data["content"]["popularSearches"] == [
        "MRI Scanner",
        "Surgical Table",
        "Endoscope",
    ]

    # Verify persisted via GET
    get_res = client.get("/api/content/products_page")
    assert get_res.status_code == 200
    assert get_res.json()["content"]["popularSearches"] == [
        "MRI Scanner",
        "Surgical Table",
        "Endoscope",
    ]


def test_admin_update_products_page_empty_searches(client, admin_token_headers):
    updated_payload = {
        "title": "Product Catalogue Search",
        "content": {
            "title": "Specialized Medical Equipment Catalogue",
            "popularSearches": [],
        },
    }
    response = client.put(
        "/api/content/products_page",
        json=updated_payload,
        headers=admin_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["content"]["popularSearches"] == []

    # Verify GET returns [] and not defaults
    get_res = client.get("/api/content/products_page")
    assert get_res.status_code == 200
    assert get_res.json()["content"]["popularSearches"] == []


def test_admin_reset_products_page(client, admin_token_headers):
    response = client.post(
        "/api/content/reset?key=products_page",
        headers=admin_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "products_page" in data
    assert data["products_page"]["title"] == "Browse the Catalogue"
    assert len(data["products_page"]["popularSearches"]) == 7
