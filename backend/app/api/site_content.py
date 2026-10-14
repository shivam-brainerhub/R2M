from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.database import get_db
from app.init_db import DEFAULT_SITE_CONTENTS
from app.models import SiteContent, User
from app.schemas.site_content import (
    SiteContentBatchUpdate,
    SiteContentItemResponse,
    SiteContentUpdate,
)
from app.services.storage import get_storage_service

router = APIRouter(
    prefix="/content",
    tags=["Site Content & CMS"],
)

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}


def normalize_section_dict(key: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure both snake_case and camelCase keys are present in content payloads
    so frontend can consume without ambiguity.
    """
    result = dict(data)
    if key == "hero":
        # headline_part1 <-> headlinePart1
        val1 = result.get("headlinePart1") or result.get("headline_part1") or "Healthcare"
        result["headlinePart1"] = val1
        result["headline_part1"] = val1

        # headline_part2 <-> headlinePart2
        val2 = result.get("headlinePart2") or result.get("headline_part2") or "without"
        result["headlinePart2"] = val2
        result["headline_part2"] = val2

        # headline_accent <-> headlineAccent
        val3 = result.get("headlineAccent") or result.get("headline_accent") or "limits."
        result["headlineAccent"] = val3
        result["headline_accent"] = val3

        # subheading
        result["subheading"] = result.get("subheading") or ""

        # show_search_bar <-> showSearchBar
        sb_val = result.get("showSearchBar")
        if sb_val is None:
            sb_val = result.get("show_search_bar", True)
        result["showSearchBar"] = bool(sb_val)
        result["show_search_bar"] = bool(sb_val)

        # search_placeholder <-> searchPlaceholder
        sp = result.get("searchPlaceholder") or result.get("search_placeholder") or "Search products, models, brochures..."
        result["searchPlaceholder"] = sp
        result["search_placeholder"] = sp

        # popular_searches <-> popularSearches
        pops = result.get("popularSearches") or result.get("popular_searches") or [
            "Patient Monitor",
            "Hospital Bed",
            "ECG",
            "Pulse Oximeter",
            "Infusion Pump",
            "Defibrillator",
            "Ultrasound",
        ]
        result["popularSearches"] = pops
        result["popular_searches"] = pops

        # badge_title <-> badgeTitle
        bt = result.get("badgeTitle") or result.get("badge_title") or "TRUST • ACCESS • INNOVATION • IMPACT"
        result["badgeTitle"] = bt
        result["badge_title"] = bt

        # badge_tagline <-> badgeTagline
        btg = result.get("badgeTagline") or result.get("badge_tagline") or "A HEALTHIER TOMORROW TOGETHER."
        result["badgeTagline"] = btg
        result["badge_tagline"] = btg

    elif key == "company":
        cn = result.get("companyName") or result.get("company_name") or "SA Healthcare"
        result["companyName"] = cn
        result["company_name"] = cn

        result["phone"] = result.get("phone") or "+27 11 555 0100"

        tf = result.get("tollFree") or result.get("toll_free") or "0800 123 456"
        result["tollFree"] = tf
        result["toll_free"] = tf

        result["email"] = result.get("email") or "info@sahealthcare.com"

        se = result.get("salesEmail") or result.get("sales_email") or "quotes@sahealthcare.com"
        result["salesEmail"] = se
        result["sales_email"] = se

        pa = result.get("physicalAddress") or result.get("physical_address") or "15 Medical Boulevard, Sandton, Johannesburg, 2196, South Africa"
        result["physicalAddress"] = pa
        result["physical_address"] = pa

        result["hours"] = result.get("hours") or "Monday – Friday: 08:00 – 17:00 (SAST)"

    elif key == "why_us":
        st = result.get("sectionTag") or result.get("section_tag") or "WHY SA HEALTHCARE"
        result["sectionTag"] = st
        result["section_tag"] = st
        result["title"] = result.get("title") or "Why choose SA Healthcare"
        if "items" not in result:
            result["items"] = DEFAULT_SITE_CONTENTS.get("why_us", {}).get("content", {}).get("items", [])

    elif key == "cta":
        result["heading"] = result.get("heading") or "Need a quotation or product advice?"
        result["subheading"] = result.get("subheading") or "Speak to our team for expert guidance and tailored solutions for your facility."
        bt = result.get("buttonText") or result.get("button_text") or "Request a Quote"
        result["buttonText"] = bt
        result["button_text"] = bt
        bl = result.get("buttonLink") or result.get("button_link") or "/contact"
        result["buttonLink"] = bl
        result["button_link"] = bl
        result["phone"] = result.get("phone") or "+27 11 555 0100"
        result["email"] = result.get("email") or "info@sahealthcare.com"

    return result


@router.get("", response_model=Dict[str, Any])
def get_all_site_content(db: Session = Depends(get_db)):
    """
    Retrieve all site content sections. Public endpoint consumed by homepage, admin, footer, etc.
    """
    records = db.query(SiteContent).all()
    content_map: Dict[str, Any] = {}
    sections_meta: Dict[str, Any] = {}

    for r in records:
        normalized = normalize_section_dict(r.key, r.content or {})
        content_map[r.key] = normalized
        sections_meta[r.key] = {
            "id": r.id,
            "key": r.key,
            "title": r.title,
            "content": normalized,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }

    # Ensure defaults are present if any key is missing
    for default_key, default_info in DEFAULT_SITE_CONTENTS.items():
        if default_key not in content_map:
            normalized = normalize_section_dict(default_key, default_info["content"])
            content_map[default_key] = normalized
            sections_meta[default_key] = {
                "key": default_key,
                "title": default_info["title"],
                "content": normalized,
                "updated_at": None,
                "created_at": None,
            }

    content_map["sections"] = sections_meta
    return content_map


@router.get("/{key}", response_model=SiteContentItemResponse)
def get_site_content_section(key: str, db: Session = Depends(get_db)):
    """
    Retrieve a specific content section by its key (e.g. hero, company, why_us, cta).
    """
    record = db.query(SiteContent).filter(SiteContent.key == key).first()
    if not record:
        if key in DEFAULT_SITE_CONTENTS:
            default_info = DEFAULT_SITE_CONTENTS[key]
            normalized = normalize_section_dict(key, default_info["content"])
            record = SiteContent(key=key, title=default_info["title"], content=normalized)
            db.add(record)
            db.commit()
            db.refresh(record)
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Content section '{key}' not found",
            )

    record.content = normalize_section_dict(record.key, record.content or {})
    return record


@router.put("/{key}", response_model=SiteContentItemResponse)
def update_site_content_section(
    key: str,
    payload: SiteContentUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Update a specific content section. Requires Admin privileges.
    """
    normalized = normalize_section_dict(key, payload.content)
    record = db.query(SiteContent).filter(SiteContent.key == key).first()

    if not record:
        default_title = DEFAULT_SITE_CONTENTS.get(key, {}).get("title", key.replace("_", " ").title())
        record = SiteContent(
            key=key,
            title=payload.title or default_title,
            content=normalized,
        )
        db.add(record)
    else:
        if payload.title is not None:
            record.title = payload.title
        record.content = normalized

    db.commit()
    db.refresh(record)
    return record


@router.post("/batch", response_model=Dict[str, Any])
def batch_update_site_content(
    payload: SiteContentBatchUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Update multiple site content sections in a single request. Requires Admin privileges.
    """
    for section_key, section_data in payload.sections.items():
        normalized = normalize_section_dict(section_key, section_data)
        record = db.query(SiteContent).filter(SiteContent.key == section_key).first()
        if not record:
            default_title = DEFAULT_SITE_CONTENTS.get(section_key, {}).get("title", section_key.replace("_", " ").title())
            record = SiteContent(
                key=section_key,
                title=default_title,
                content=normalized,
            )
            db.add(record)
        else:
            record.content = normalized

    db.commit()
    return get_all_site_content(db=db)


@router.post("/reset", response_model=Dict[str, Any])
def reset_site_content(
    key: Optional[str] = Query(None, description="Optional key of section to reset, e.g. hero, company. If omitted, resets all sections."),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    """
    Reset one or all site content sections to default initial data. Requires Admin privileges.
    """
    keys_to_reset = [key] if key else list(DEFAULT_SITE_CONTENTS.keys())

    for k in keys_to_reset:
        if k in DEFAULT_SITE_CONTENTS:
            default_info = DEFAULT_SITE_CONTENTS[k]
            normalized = normalize_section_dict(k, default_info["content"])
            record = db.query(SiteContent).filter(SiteContent.key == k).first()
            if record:
                record.title = default_info["title"]
                record.content = normalized
            else:
                db.add(SiteContent(key=k, title=default_info["title"], content=normalized))

    db.commit()
    return get_all_site_content(db=db)


@router.post("/upload-image")
def upload_content_image(
    file: UploadFile = File(...),
    current_admin: User = Depends(require_admin),
):
    """
    Upload an image for site CMS (e.g., promotional banner, hero graphics). Requires Admin privileges.
    """
    storage = get_storage_service()
    result = storage.save_file(
        file=file,
        folder="content",
        allowed_extensions=ALLOWED_IMAGE_EXTENSIONS,
    )
    return {
        "url": result.get("url") or result.get("file_url"),
        "filename": result["filename"],
        "size": result.get("size", 0),
        "content_type": result.get("content_type", ""),
    }
