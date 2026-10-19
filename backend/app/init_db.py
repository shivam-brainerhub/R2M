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
    Sector,
    SiteContent,
    Subcategory,
    User,
    UserRole,
    product_sector_association,
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

SEED_SECTORS = [
    {"name": "Hospitals & Healthcare Groups"},
    {"name": "Clinics & Primary Care"},
    {"name": "Pharmacies & Retail Healthcare"},
    {"name": "Public Healthcare"},
    {"name": "Laboratories"},
    {"name": "Specialist Care"},
    {"name": "Veterinary Practices"},
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
            "button_link": "/quote",
            "phone": "+27 11 555 0100",
            "email": "info@sahealthcare.com",
        },
    },
    "privacy_policy": {
        "title": "Privacy Policy",
        "content": {
            "title": "Privacy Policy",
            "subtitle": "How SA Healthcare collects, protects, and handles your personal information in compliance with POPIA.",
            "last_updated": "October 2026",
            "content": """<h2>1. Commitment to Privacy</h2>
<p>SA Healthcare ("we", "our", or "us") is committed to protecting the privacy and personal information of our healthcare clients, suppliers, and website visitors. This Privacy Policy outlines our practices regarding information collection, storage, and processing in accordance with the Protection of Personal Information Act (POPIA) of South Africa.</p>

<h2>2. Information We Collect</h2>
<p>We collect information to provide tailored medical equipment quotations, support, and technical services: contact details (name, email, phone, facility name), quotation requests, user credentials, and technical usage data for performance and security.</p>

<h2>3. Purpose of Processing</h2>
<p>Personal information is processed strictly for preparing and delivering formal equipment quotations, coordinating logistics and manufacturer warranty registration, communicating product safety notices, and fulfilling healthcare regulatory compliance standards.</p>

<h2>4. Data Protection & Security</h2>
<p>We employ industry-standard technical and organizational security measures—including TLS encryption, role-based access control, and secure database hosting—to protect your personal information against unauthorized access, loss, or disclosure.</p>

<h2>5. Your Rights Under POPIA</h2>
<p>As an authorized data subject, you have the right to request confirmation of personal information held, request correction or deletion of inaccurate details, and object to processing on reasonable grounds.</p>

<h2>6. Contact Our Information Officer</h2>
<p>If you have questions regarding this Privacy Policy or wish to exercise your data subject rights, please contact our Information Office at <a href="mailto:info@sahealthcare.com">info@sahealthcare.com</a> or +27 11 555 0100 (15 Medical Boulevard, Sandton, Johannesburg).</p>""",
        },
    },
    "terms_of_use": {
        "title": "Terms of Use",
        "content": {
            "title": "Terms of Use",
            "subtitle": "Terms governing the use of the SA Healthcare digital equipment catalogue and quote request system.",
            "last_updated": "October 2026",
            "content": """<h2>1. Acceptance of Terms</h2>
<p>By accessing, browsing, or utilizing the SA Healthcare digital catalogue, requesting quotes, or downloading technical brochures, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, please refrain from using the platform.</p>

<h2>2. Catalogue & Quotation Service</h2>
<p>Product listings, specifications, and brochure downloads are provided for informational and clinical evaluation purposes. Items added to the Quote Cart represent formal quotation requests, which are confirmed through official commercial representatives with valid pricing.</p>

<h2>3. Professional Healthcare Use</h2>
<p>Our medical equipment and diagnostic systems are intended for professional healthcare facilities, licensed medical practitioners, procurement bodies, and certified clinical organizations.</p>

<h2>4. Intellectual Property</h2>
<p>All trademarks, product logos, technical datasheets, brochures, and platform content remain the intellectual property of SA Healthcare or their respective manufacturing brand partners.</p>

<h2>5. Limitation of Liability</h2>
<p>To the fullest extent permitted under applicable law, SA Healthcare shall not be liable for indirect, incidental, or consequential damages arising from catalogue unavailability or specification updates by manufacturers.</p>

<h2>6. Inquiries & Commercial Terms</h2>
<p>For commercial agreements, tender submissions, or warranty inquiries, contact our commercial department at <a href="mailto:quotes@sahealthcare.com">quotes@sahealthcare.com</a> or +27 11 555 0100 (15 Medical Boulevard, Sandton, Johannesburg).</p>""",
        },
    },
    "products_page": {
        "title": "Product Catalogue Search",
        "content": {
            "title": "Browse the Catalogue",
            "subtitle": "Explore our range of medical products from trusted global manufacturers.",
            "search_placeholder": "Search by product, model number, manufacturer...",
            "popular_searches": [
                "Patient Monitor",
                "Hospital Bed",
                "ECG",
                "Pulse Oximeter",
                "Infusion Pump",
                "Defibrillator",
                "Ultrasound",
            ],
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

    # 4b. Seed initial sectors if empty
    if db.query(Sector).count() == 0:
        logger.info("Seeding initial healthcare sectors...")
        for sec_data in SEED_SECTORS:
            sector = Sector(name=sec_data["name"])
            db.add(sector)
        db.commit()
        logger.info("Initial healthcare sectors seeded successfully.")

    # 4c. Associate initial products to sectors if association table is empty
    assoc_rows = db.execute(product_sector_association.select()).fetchall()
    if len(assoc_rows) == 0:
        logger.info("Associating catalogue products to initial sectors...")
        all_sectors = {s.name: s for s in db.query(Sector).all()}
        all_products = db.query(Product).all()

        for p in all_products:
            cat_code = p.category.code if p.category else ""
            cat_name = p.category.name.lower() if p.category else ""
            prod_name = p.name.lower()

            p_sectors = []
            if cat_code == "09" or "veterinary" in cat_name or "vet" in prod_name:
                if "Veterinary Practices" in all_sectors:
                    p_sectors.append(all_sectors["Veterinary Practices"])
            elif cat_code == "08" or "lab" in cat_name:
                if "Laboratories" in all_sectors:
                    p_sectors.append(all_sectors["Laboratories"])
            else:
                # General clinical / medical equipment
                if cat_code in ["01", "02", "04", "05", "07"]:
                    if "Hospitals & Healthcare Groups" in all_sectors:
                        p_sectors.append(all_sectors["Hospitals & Healthcare Groups"])
                if cat_code in ["01", "03", "06"] or "clinic" in prod_name or "vital signs" in prod_name:
                    if "Clinics & Primary Care" in all_sectors:
                        p_sectors.append(all_sectors["Clinics & Primary Care"])
                if cat_code in ["01", "03", "06"] and ("blood pressure" in prod_name or "thermometer" in prod_name or "bandage" in prod_name or "pulse oximeter" in prod_name or "wheelchair" in prod_name):
                    if "Pharmacies & Retail Healthcare" in all_sectors:
                        p_sectors.append(all_sectors["Pharmacies & Retail Healthcare"])
                if cat_code in ["01", "02", "03", "04", "05", "06"]:
                    if "Public Healthcare" in all_sectors:
                        p_sectors.append(all_sectors["Public Healthcare"])
                if cat_code in ["01", "05", "07"] and ("ecg" in prod_name or "defibrillator" in prod_name or "suction" in prod_name or "ventilator" in prod_name or "surgical" in prod_name or "holter" in prod_name or "doppler" in prod_name):
                    if "Specialist Care" in all_sectors:
                        p_sectors.append(all_sectors["Specialist Care"])

            if p_sectors:
                p.sectors = list(set(p_sectors))

        db.commit()
        logger.info("Catalogue products associated with initial sectors successfully.")



    # 5. Seed initial Site Content CMS records if not present
    for sc_key, sc_data in DEFAULT_SITE_CONTENTS.items():
        existing_sc = db.query(SiteContent).filter(SiteContent.key == sc_key).first()
        if not existing_sc:
            db.add(SiteContent(key=sc_key, title=sc_data["title"], content=sc_data["content"]))
    db.commit()
    logger.info("Site content CMS sections verified/seeded successfully.")

