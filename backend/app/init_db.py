import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import (
    Brand,
    Category,
    Product,
    ProductImage,
    ProductPropertyValue,
    Property,
    SiteContent,
    Subcategory,
    User,
    UserRole,
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEED_CATEGORIES = [
    {"name": "Diagnostic and Measure", "code": "01", "slug": "diagnostic-and-measure", "icon": "monitor_heart", "description": "Patient monitors, ECG, ultrasound, thermometers, scales."},
    {"name": "Furniture", "code": "02", "slug": "furniture", "icon": "bed", "description": "Hospital beds, operating tables and medical furniture."},
    {"name": "Disposables and Care Supplies", "code": "03", "slug": "disposables-and-care-supplies", "icon": "clean_hands", "description": "Gloves, gowns, bandages, dressings, tubes, syringes."},
    {"name": "Hygiene and Sterilisation", "code": "04", "slug": "hygiene-and-sterilisation", "icon": "sanitizer", "description": "Autoclaves, UV sterilisers, cleaning products, disinfectants."},
    {"name": "Emergency, Reanimation and Surgery", "code": "05", "slug": "emergency-reanimation-and-surgery", "icon": "medical_services", "description": "Defibrillators, AEDs, resuscitation, stretchers."},
    {"name": "Living Aid", "code": "06", "slug": "living-aid", "icon": "accessible", "description": "Wheelchairs, crutches, walkers, patient transfer aids."},
    {"name": "Instruments", "code": "07", "slug": "instruments", "icon": "content_cut", "description": "Scissors, forceps, speculums, laryngoscopes, otoscopes."},
    {"name": "Lab", "code": "08", "slug": "lab", "icon": "science", "description": "Laboratory equipment, fridges, containers, petri dishes."},
    {"name": "Veterinary", "code": "09", "slug": "veterinary", "icon": "pets", "description": "Veterinary equipment, instruments and consumables."},
]

SEED_BRANDS = [
    {"name": "Mindray", "slug": "mindray", "country": "Global / Shenzhen", "description": "Pioneering patient monitoring, life support and diagnostic solutions.", "logo_url": "/media/brands/mindray.png", "featured_in_slider": True},
    {"name": "Philips", "slug": "philips", "country": "Netherlands", "description": "Advanced clinical patient surveillance, imaging and acute monitoring.", "logo_url": "/media/brands/philips.png", "featured_in_slider": True},
    {"name": "Dräger", "slug": "draeger", "country": "Germany", "description": "Medical technology specialist in acute point-of-care and anaesthesia.", "logo_url": "/media/brands/draeger.png", "featured_in_slider": True},
    {"name": "Contec", "slug": "contec", "country": "Global", "description": "Specialised electronic patient monitoring, pulse oximetry and ECG.", "logo_url": "/media/brands/contec.png", "featured_in_slider": True},
    {"name": "Baxter", "slug": "baxter", "country": "USA", "description": "Essential hospital healthcare products and fluid management systems.", "logo_url": "/media/brands/baxter.png", "featured_in_slider": True},
    {"name": "Welch Allyn", "slug": "welch-allyn", "country": "USA", "description": "Leading frontline diagnostic equipment and physical assessment instruments.", "logo_url": "/media/brands/welch_allyn.png", "featured_in_slider": True},
    {"name": "BD", "slug": "bd", "country": "USA", "description": "Medical technology improving drug delivery, vaccine delivery and diagnostics.", "logo_url": "/media/brands/bd.png", "featured_in_slider": True},
    {"name": "3M", "slug": "3m", "country": "USA", "description": "Critical infection prevention, wound care, Littmann stethoscopes and PPE.", "logo_url": "/media/brands/3m.png", "featured_in_slider": True},
]

DEFAULT_SITE_CONTENTS = {
    "hero": {
        "title": "Homepage Hero & Search",
        "content": {
            "headline_part1": "Healthcare",
            "headline_part2": "without",
            "headline_accent": "limits.",
            "subheading": "Explore SA Healthcare's growing digital healthcare catalogue. Search products, brochures and technical specifications from trusted global manufacturers.",
            "show_search_bar": True,
            "search_placeholder": "Search by product, model number, manufacturer, brochure or technical specification...",
            "popular_searches": [
                "Patient Monitor",
                "Hospital Bed",
                "ECG",
                "Pulse Oximeter",
                "Infusion Pump",
                "Defibrillator",
                "Ultrasound",
            ],
            "badge_title": "TRUST • ACCESS • INNOVATION • IMPACT",
            "badge_tagline": "A HEALTHIER TOMORROW TOGETHER.",
        },
    },
    "company": {
        "title": "Contact & Company Info",
        "content": {
            "company_name": "SA Healthcare",
            "phone": "+27 11 555 0100",
            "toll_free": "0800 123 456",
            "email": "info@sahealthcare.com",
            "sales_email": "quotes@sahealthcare.com",
            "physical_address": "15 Medical Boulevard, Sandton, Johannesburg, 2196, South Africa",
            "hours": "Monday – Friday: 08:00 – 17:00 (SAST)",
        },
    },
    "why_us": {
        "title": "Why SA Healthcare",
        "content": {
            "section_tag": "WHY SA HEALTHCARE",
            "title": "Why choose SA Healthcare",
            "items": [
                {
                    "id": "1",
                    "icon": "language",
                    "title": "Trusted Global Manufacturers",
                    "description": "A comprehensive range of products from leading brands worldwide.",
                },
                {
                    "icon": "description",
                    "title": "Brochures & Technical Information",
                    "description": "Every product includes brochures and technical specifications.",
                },
                {
                    "icon": "chat",
                    "title": "Request a Quote",
                    "description": "Receive personalised assistance from our healthcare specialists.",
                },
            ],
        },
    },
    "cta": {
        "title": "Call to Action & Quotation",
        "content": {
            "heading": "Need a quotation or product advice?",
            "subheading": "Speak to our team for expert guidance and tailored solutions for your facility.",
            "button_text": "Request a Quote",
            "button_link": "/contact",
            "phone": "+27 11 555 0100",
            "email": "info@sahealthcare.com",
        },
    },
}



def init_db(db: Session) -> None:
    # 1. Seed initial admin user if not present
    admin = (
        db.query(User)
        .filter(
            (User.email == settings.INITIAL_ADMIN_EMAIL)
            | (User.role == UserRole.ADMIN)
        )
        .first()
    )

    if not admin:
        logger.info("Creating initial admin user...")
        admin_user = User(
            email=settings.INITIAL_ADMIN_EMAIL,
            username=settings.INITIAL_ADMIN_USERNAME,
            full_name="Platform Administrator",
            hashed_password=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            is_active=True,
            is_email_verified=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        logger.info(
            f"Initial admin created successfully: {settings.INITIAL_ADMIN_EMAIL}"
        )
    else:
        logger.info("Admin user already exists. Skipping user seed.")

    # 2. Seed initial categories if empty
    if db.query(Category).count() == 0:
        logger.info("Seeding initial categories...")
        for cat_data in SEED_CATEGORIES:
            cat = Category(**cat_data)
            db.add(cat)
        db.commit()
        logger.info("Initial categories seeded successfully.")

    # 2b. Seed initial subcategories if empty
    if db.query(Subcategory).count() == 0:
        logger.info("Seeding initial subcategories...")
        diag_cat = db.query(Category).filter(Category.slug == "diagnostic-and-measure").first()
        furn_cat = db.query(Category).filter(Category.slug == "furniture").first()
        if diag_cat:
            diag_subs = [
                ("Patient Monitors", "patient-monitors"),
                ("ECG", "ecg"),
                ("Ultrasound", "ultrasound"),
                ("Thermometers", "thermometers"),
                ("Blood Pressure", "blood-pressure"),
                ("Glucose Monitoring", "glucose-monitoring"),
                ("Weighing Scales", "weighing-scales"),
                ("Pulse Oximeters", "pulse-oximeters"),
                ("Other", "other-diagnostics"),
            ]
            for s_name, s_slug in diag_subs:
                db.add(Subcategory(category_id=diag_cat.id, name=s_name, slug=s_slug))

        if furn_cat:
            furn_subs = [
                ("Hospital Beds", "hospital-beds"),
                ("Operating Tables", "operating-tables"),
                ("Medical Carts", "medical-carts"),
            ]
            for s_name, s_slug in furn_subs:
                db.add(Subcategory(category_id=furn_cat.id, name=s_name, slug=s_slug))
        db.commit()
        logger.info("Initial subcategories seeded successfully.")

    # 3. Seed initial brands if empty
    if db.query(Brand).count() == 0:
        logger.info("Seeding initial brands...")
        for brand_data in SEED_BRANDS:
            brand = Brand(**brand_data)
            db.add(brand)
        db.commit()

        logger.info("Initial brands seeded successfully.")

    # 4. Seed initial properties if empty
    seed_properties_list = [
        {"name": "Display Size", "group": "Display"},
        {"name": "Touch Screen", "group": "Display"},
        {"name": "Battery Life", "group": "Power"},
        {"name": "Weight", "group": "Physical"},
        {"name": "Parameters", "group": "Clinical"},
        {"name": "Alarms", "group": "Safety"},
        {"name": "Trend Analysis", "group": "Clinical"},
        {"name": "Telemetry", "group": "Connectivity"},
    ]
    if db.query(Property).count() == 0:
        logger.info("Seeding initial properties...")
        for p_data in seed_properties_list:
            prop = Property(name=p_data["name"], group=p_data["group"])
            db.add(prop)
        db.commit()
        logger.info("Initial properties seeded successfully.")

    # 5. Seed initial products if empty
    if db.query(Product).count() == 0:
        logger.info("Seeding initial products...")
        diag_cat = db.query(Category).filter(Category.slug == "diagnostic-and-measure").first()
        mindray_b = db.query(Brand).filter(Brand.slug == "mindray").first()
        philips_b = db.query(Brand).filter(Brand.slug == "philips").first()
        draeger_b = db.query(Brand).filter(Brand.slug == "draeger").first()
        contec_b = db.query(Brand).filter(Brand.slug == "contec").first()

        seed_products_data = [
            {
                "name": "BeneVision N12",
                "slug": "benevision-n12",
                "sku": "MN-N12-001",
                "brand_id": mindray_b.id if mindray_b else None,
                "category_id": diag_cat.id if diag_cat else None,
                "short_description": '12.1" multi-parameter patient monitor with capacitive touchscreen.',
                "description": 'The BeneVision N12 patient monitor provides a clear, comprehensive view of patient status. With its capacitive touchscreen and advanced clinical tools, it supports clinical decision-making in demanding healthcare environments.',
                "brochure_url": "/media/brochures/benevision_n12.pdf",
                "status": "Active",
                "images": [
                    {"image_url": "/images/benevision_n12.jpg", "alt_text": "BeneVision N12 Front", "is_primary": True, "display_order": 0},
                    {"image_url": "/images/benevision_n12.jpg", "alt_text": "BeneVision N12 Angle", "is_primary": False, "display_order": 1},
                ],
                "properties": {
                    "Display Size": '12.1" Touchscreen',
                    "Touch Screen": "Yes",
                    "Battery Life": "Up to 4 hours",
                    "Weight": "4.0 kg",
                    "Parameters": "ECG, SpO2, NIBP, IBP, Temp",
                    "Alarms": "Visual & Audible",
                    "Trend Analysis": "120 Hours",
                    "Telemetry": "Built-in Wi-Fi & LAN",
                },
            },
            {
                "name": "IntelliVue MX450",
                "slug": "intellivue-mx450",
                "sku": "PH-MX450-002",
                "brand_id": philips_b.id if philips_b else None,
                "category_id": diag_cat.id if diag_cat else None,
                "short_description": "Flexible, high-performance patient monitor for acute care.",
                "description": "Flexible, high-performance patient monitor for acute care and surveillance.",
                "brochure_url": "/media/brochures/intellivue_mx450.pdf",
                "status": "Active",
                "images": [
                    {"image_url": "/images/intellivue_mx450.jpg", "alt_text": "Philips MX450", "is_primary": True, "display_order": 0},
                ],
                "properties": {
                    "Display Size": '12.0" Touchscreen',
                    "Touch Screen": "Yes",
                    "Battery Life": "Up to 5 hours",
                    "Weight": "4.5 kg",
                    "Parameters": "ECG, Resp, SpO2, NIBP, Temp",
                    "Alarms": "Visual & Audible",
                    "Trend Analysis": "96 Hours",
                    "Telemetry": "Wired & Wireless",
                },
            },
            {
                "name": "Infinity M300",
                "slug": "infinity-m300",
                "sku": "DR-M300-003",
                "brand_id": draeger_b.id if draeger_b else None,
                "category_id": diag_cat.id if diag_cat else None,
                "short_description": "Compact patient monitor and telemetry for continuous surveillance.",
                "description": "Compact patient monitor and telemetry for continuous patient surveillance.",
                "brochure_url": "/media/brochures/infinity_m300.pdf",
                "status": "Active",
                "images": [
                    {"image_url": "/images/infinity_m300.jpg", "alt_text": "Dräger Infinity M300", "is_primary": True, "display_order": 0},
                ],
                "properties": {
                    "Display Size": "Color OLED",
                    "Touch Screen": "No",
                    "Battery Life": "Up to 14 hours",
                    "Weight": "0.3 kg",
                    "Parameters": "ECG, SpO2",
                    "Alarms": "Visual & Audible",
                    "Trend Analysis": "Central Station",
                    "Telemetry": "Built-in Wi-Fi",
                },
            },
            {
                "name": "CMS8000",
                "slug": "contec-cms8000",
                "sku": "CT-CMS8000-004",
                "brand_id": contec_b.id if contec_b else None,
                "category_id": diag_cat.id if diag_cat else None,
                "short_description": "Multi-parameter patient monitor for bedside clinical monitoring.",
                "description": "Multi-parameter patient monitor for bedside clinical monitoring.",
                "brochure_url": "/media/brochures/cms8000.pdf",
                "status": "Active",
                "images": [
                    {"image_url": "/images/contec_cms8000.jpg", "alt_text": "Contec CMS8000", "is_primary": True, "display_order": 0},
                ],
                "properties": {
                    "Display Size": '12.1" TFT LCD',
                    "Touch Screen": "Optional",
                    "Battery Life": "Up to 2 hours",
                    "Weight": "3.8 kg",
                    "Parameters": "ECG, RESP, NIBP, SpO2",
                    "Alarms": "Visual & Audible",
                    "Trend Analysis": "72 Hours",
                    "Telemetry": "Central Monitoring Ready",
                },
            },
        ]

        # Cache existing properties by name
        prop_cache = {p.name.lower(): p for p in db.query(Property).all()}

        for prod_item in seed_products_data:
            prod = Product(
                name=prod_item["name"],
                slug=prod_item["slug"],
                sku=prod_item["sku"],
                brand_id=prod_item["brand_id"],
                category_id=prod_item["category_id"],
                short_description=prod_item["short_description"],
                description=prod_item["description"],
                brochure_url=prod_item["brochure_url"],
                status=prod_item["status"],
                specifications=prod_item["properties"],
            )
            db.add(prod)
            db.flush()

            for img_info in prod_item["images"]:
                db.add(
                    ProductImage(
                        product_id=prod.id,
                        image_url=img_info["image_url"],
                        alt_text=img_info["alt_text"],
                        is_primary=img_info["is_primary"],
                        display_order=img_info["display_order"],
                    )
                )

            for p_name, p_val in prod_item["properties"].items():
                matched_prop = prop_cache.get(p_name.lower())
                if not matched_prop:
                    matched_prop = Property(name=p_name)
                    db.add(matched_prop)
                    db.flush()
                    prop_cache[p_name.lower()] = matched_prop

                db.add(
                    ProductPropertyValue(
                        product_id=prod.id,
                        property_id=matched_prop.id,
                        value=p_val,
                    )
                )

        db.commit()
        logger.info("Initial products seeded successfully.")

    # 5. Seed initial Site Content CMS records if not present
    for sc_key, sc_data in DEFAULT_SITE_CONTENTS.items():
        existing_sc = db.query(SiteContent).filter(SiteContent.key == sc_key).first()
        if not existing_sc:
            db.add(SiteContent(key=sc_key, title=sc_data["title"], content=sc_data["content"]))
    db.commit()
    logger.info("Site content CMS sections verified/seeded successfully.")

