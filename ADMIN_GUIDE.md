# SA Healthcare Digital Platform — Administrator & CMS User Guide

**Target Audience:** Route 2 Market Solutions (R2M) & SA Healthcare (SAHC) Operational Staff, Content Managers, and Sales Teams
**Platform Version:** 1.0 (Phase 1 Compliant)
**Access Portal:** `https://your-domain.co.za/admin` (Local: `http://localhost:3000/admin`)

---

## Table of Contents
1. [Platform Access & Security](#1-platform-access--security)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Product Catalogue Management](#3-product-catalogue-management)
   - [3.1 Creating a New Product](#31-creating-a-new-product)
   - [3.2 Managing Multi-Type Official Documents](#32-managing-multi-type-official-documents)
   - [3.3 Managing Specifications & Dynamic Properties](#33-managing-specifications--dynamic-properties)
   - [3.4 Assigning Healthcare Sectors & Categories](#34-assigning-healthcare-sectors--categories)
4. [Category, Subcategory & Brand Management](#4-category-subcategory--brand-management)
5. [Website Content Management (CMS)](#5-website-content-management-cms)
   - [5.1 Homepage Hero & Popular Search Keywords](#51-homepage-hero--popular-search-keywords)
   - [5.2 Catalogue Banner & Search Customization](#52-catalogue-banner--search-customization)
   - [5.3 Company Profile & Office Contact Details](#53-company-profile--office-contact-details)
   - [5.4 Legal Pages & Rich Text Editing (Terms & Privacy)](#54-legal-pages--rich-text-editing-terms--privacy)
6. [Quotation Requests (RFQ) & Sales Pipeline](#6-quotation-requests-rfq--sales-pipeline)
7. [Inquiries & Prospective Supplier Applications](#7-inquiries--prospective-supplier-applications)
8. [User IAM & Access Administration](#8-user-iam--access-administration)
9. [Technical Operations & Maintenance](#9-technical-operations--maintenance)

---

## 1. Platform Access & Security

### 1.1 Accessing the Admin Portal
- Navigate to `/login` or click **Login** in the top navigation bar.
- Sign in with an account that has the **Admin** role.
- Once authenticated, an **Admin Portal** button will appear in the navigation bar and user profile dropdown. Alternatively, navigate directly to `/admin`.
- Unauthorised users or non-admin visitors attempting to access `/admin` are automatically redirected to `/home`.

### 1.2 Initial Bootstrap Credentials
On first boot, the platform automatically provisions the default administrator specified in your `.env` file:
- **Default Email:** `admin@r2m.co.za` (or configured `INITIAL_ADMIN_EMAIL`)
- **Default Username:** `admin`
- **Default Password:** Specified by `INITIAL_ADMIN_PASSWORD`

> [!IMPORTANT]
> Immediately upon initial deployment, sign in to `/admin/users`, edit the initial admin account, and update the password to a strong, secure passphrase.

---

## 2. Dashboard Overview

The **Admin Dashboard** (`/admin`) serves as your operational mission control:

- **Key Metrics Tiles:**
  - **Total Products:** Total number of catalogued devices (Active vs Draft breakdown).
  - **Pending Quotes (RFQ):** Live count of quotation requests awaiting review or pricing.
  - **Contact Inquiries:** Unread general inquiries submitted via the website.
  - **Supplier Applications:** Inbound distribution applications from prospective manufacturers.
  - **Registered Users:** Total client accounts registered on the platform.
- **Quick Action Bar:** Direct 1-click shortcuts to add products, review quotes, update CMS copy, or view inquiries.
- **Recent Activity Stream:** Real-time log of the latest quote submissions, user registrations, and lead events.

---

## 3. Product Catalogue Management

Navigate to **Admin > Products** (`/admin/products`) to manage your medical device inventory.

### 3.1 Creating a New Product
1. Click **+ Add New Product** in the top-right corner.
2. In the modal, complete the standard clinical fields:
   - **Product Name:** Official commercial product name (e.g., *Mindray BeneVision N12*).
   - **SKU / Model Code:** Unique internal stock or cataloguing code (e.g., *MN-N12-001*).
   - **Primary Category & Subcategory:** Select the clinical department (e.g., *Diagnostic and Measure > Patient Monitors*).
   - **Manufacturer / Brand:** Select the manufacturer from the pre-populated brand list.
   - **Healthcare Sectors:** Select all clinical environments where this device is utilized (*Hospitals, Clinics, ICU, Emergency, Labs, etc.*).
   - **Status:** Set to **Active** to publish publicly, or **Draft** to keep private while drafting.
   - **Descriptions:**
     - *Short Description:* 1–2 sentence summary displayed on product search cards and comparison tables.
     - *Full Description:* Detailed clinical applications, benefits, and device overview.
3. Click **Save Product**.

### 3.2 Managing Multi-Type Official Documents
Each product can hold multiple official downloadable documents. The platform enforces authenticated, secure downloads on all official files:

1. In the product editor modal, scroll to the **Official Documents & Resources** section.
2. Under **Add Document**:
   - **Document Title:** e.g., *BeneVision N12 Technical Datasheet* or *CE Conformity Certificate*.
   - **Document Type:** Select from the 4 contractual document categories:
     - `Brochure` (Product overview brochures & sales flyers)
     - `Specifications` (Technical specifications & electrical engineering sheets)
     - `User Manual` (Operator & clinician user guides)
     - `Certificate` (SAHPRA, CE, ISO 13485 compliance certifications)
   - **Upload File:** Select the PDF file from your local workstation (accepted formats: `.pdf`, `.docx`).
3. Click **Attach Document**. The document immediately appears in the staged documents table.
4. Attached documents automatically display with corresponding color-coded icons on the **Product Detail Page**, the **Compare Matrix**, and in the central **Resource Centre (`/resources`)**.

### 3.3 Managing Specifications & Dynamic Properties
Specifications power the **Side-by-Side Product Comparison Matrix** and the dynamic catalogue sidebar filters:

- **Key Specifications (Key-Value Dict):** Enter technical parameters such as:
  - `Display Size`: `12.1-inch Multi-touch Screen`
  - `Battery Life`: `4 Hours Continuous Operation`
  - `Weight`: `4.2 kg`
- **Dynamic Property Filters:** Add searchable attributes (e.g., *Screen Size: 12.1"*, *Parameters: ECG, SpO2, NIBP, Temp*). The platform automatically aggregates these into filter checkboxes in the catalogue sidebar.

### 3.4 Product Images & Media Cleanup
- **Primary Image:** Upload the primary front-facing transparent or white-background device image.
- **Gallery Images:** Upload additional operational angles, accessory kits, and interface close-ups.
- **Orphan Media Garbage Collection:** When you delete a product or replace an image, the backend automatically performs reference checks. Unreferenced image files are cleaned up from the storage disk to save server storage.

---

## 4. Category, Subcategory & Brand Management

Navigate to **Admin > Categories** (`/admin/categories`).

### 4.1 Managing Categories
- Create or update the 9 core clinical categories (e.g., *Diagnostic and Measure*, *Emergency, Reanimation and Surgery*, *Hospital Furniture*, etc.).
- **Icon Name:** Enter standard Google Material Symbols icon names (e.g., `monitor_heart`, `bed`, `sanitizer`, `medical_services`).
- **Code:** Optional display badge code (e.g., `01`, `02`).

### 4.2 Managing Subcategories
- Add granular classifications under any parent category (e.g., *Patient Monitors*, *ECG Machines*, *Diagnostic Ultrasound* under *Diagnostic and Measure*).

### 4.3 Managing Partner Brands (Manufacturers)
- Add global medical manufacturers (e.g., *Mindray*, *Stryker*, *Philips*, *Contec*, *Rossmax*).
- Upload high-resolution brand logos.
- **Featured in Slider:** Toggle **On** to feature the brand in the animated homepage manufacturer carousel.

---

## 5. Website Content Management (CMS)

Navigate to **Admin > Website Content** (`/admin/content`) to update copy across the public website without needing code changes.

### 5.1 Homepage Hero & Popular Search Keywords
- **Headline Part 1 & 2:** e.g., `Healthcare` and `without`.
- **Accent Headline:** e.g., `limits.` (rendered in gold/light blue accent styling).
- **Subheading:** The primary introductory value proposition displayed beneath the hero headline.
- **Search Bar Toggle & Placeholder:** Enable or disable the search bar and customize the placeholder text.
- **Popular Search Terms:** Enter comma-separated keywords (e.g., *Patient Monitor, Hospital Bed, ECG, Defibrillator, Ultrasound*). These render as clickable search pills beneath the hero search bar.

### 5.2 Catalogue Banner & Search Customization
- **Title & Subtitle:** Customize the header of the product catalogue page (`/products`).
- **Popular Catalogue Searches:** Define specific search keyword pills for the catalogue.

### 5.3 Company Profile & Office Contact Details
Centralized contact details used automatically across the **Footer**, **Contact Page**, and **Quote Forms**:
- Company Legal Name: *SA Healthcare*
- Main Phone Number: `+27 11 555 0100`
- Toll-Free Number: `0800 123 456`
- General Email: `info@sahealthcare.com`
- Dedicated Sales Email: `quotes@sahealthcare.com`
- Physical Address: *15 Medical Boulevard, Sandton, Johannesburg, South Africa*
- Business Hours: *Monday – Friday: 08:00 – 17:00 (SAST)*

### 5.4 Legal Pages & Rich Text Editing (Terms & Privacy)
- Select the **Privacy Policy** or **Terms of Use** tab.
- Edit the text using the built-in WYSIWYG rich text toolbar (headings, bold, lists, quotes, links).
- Toggle **Live Preview** to inspect typography before publishing.
- Click **Save Content**. Changes immediately go live on `/terms` and `/privacy`.
- If required, click **Reset to Defaults** to restore standard compliance copy.

---

## 6. Quotation Requests (RFQ) & Sales Pipeline

Navigate to **Admin > Quotes** (`/admin/quotes`).

### 6.1 Reviewing Inbound RFQs
The platform captures detailed quote requests from healthcare professionals and procurement teams:
- **Quote Number:** Unique identifier (e.g., `QR-2026-8K4T9M`).
- **Facility Information:** Healthcare facility / hospital name, department, delivery city, postal code.
- **Customer Details:** Requester name, email, phone number, and organization.
- **Urgency Level:** `Standard`, `Urgent`, or `Critical` (color-coded badges).

### 6.2 Processing & Pricing a Quote
1. Click on any quote in the table to open the **Quote Details Modal**.
2. Review the requested items table: Product Name, SKU, Manufacturer, Requested Quantity, and item-specific clinical notes.
3. **Workflow Status Lifecycle:**
   - `New`: Unreviewed inbound submission.
   - `In Review`: Assigned to a sales representative; currently checking supplier availability.
   - `Quoted`: Official pricing calculated. Enter the final total in the **Quoted Amount (ZAR)** field.
   - `Approved`: Customer accepted quote terms.
   - `Declined`: Customer declined or project cancelled.
4. **Internal Admin Notes:** Record internal pricing notes, supplier lead times, or courier quotes (private to staff).
5. Click **Update Quote**.

---

## 7. Inquiries & Prospective Supplier Applications

Navigate to **Admin > Inquiries** (`/admin/inquiries`).

### 7.1 Contact Inquiries
- View general inbound website messages from the `/contact` page.
- Filter by status: `New`, `In Progress`, `Responded`, `Archived`.
- Click on any message to view the full message text, sender organization, and contact phone.

### 7.2 Prospective Supplier Applications
- View applications submitted through the **Become a Supplier** portal (`/supplier`).
- Captures company legal name, country of manufacture, contact details, certified medical product categories, and distribution readiness.
- Update application review statuses to track supplier onboarding.

---

## 8. User IAM & Access Administration

Navigate to **Admin > Users** (`/admin/users`).

### 8.1 User Management Capabilities
- **Search Users:** Search by full name, email, username, or organization.
- **Role Assignment:**
  - `Admin`: Full read/write access to CMS, catalogue, quotes, inquiries, and user management.
  - `User`: Standard verified healthcare client; can view catalogue, submit RFQs, track past quotes in `/profile`, and download protected documentation.
- **Account Actions:**
  - **Edit User:** Update user full name, email, phone, organization, and role.
  - **Account Status Toggle:** Instantly **Activate** or **Suspend** user accounts.
  - **Admin Password Override:** Set a temporary or new password for users locked out of their accounts.
  - **Resend Verification Email:** Trigger a fresh email verification link to users with unverified emails.
- **Add New User:** Manually provision administrative or client accounts directly from the admin panel.

---

## 9. Technical Operations & Maintenance

### 9.1 Environment Configuration (`.env`)
The platform reads configuration from `.env` in the project root:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8000`).
- `NEXT_PUBLIC_SITE_URL`: Canonical production domain (e.g., `https://sahealthcare.co.za`).
- `NEXT_PUBLIC_GA_ID`: Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`).
- `NEXT_PUBLIC_GTM_ID`: Google Tag Manager Container ID (`GTM-XXXXXXX`).
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`: Google Search Console verification token.
- `JWT_SECRET_KEY`: High-entropy 64-character secret for signing access tokens.
- `SMTP_*`: Mail server credentials for automated email dispatch.

### 9.2 Running Database Migrations
When schema updates are deployed, execute migrations inside the Docker container:
```bash
docker compose exec backend alembic upgrade head
```

### 9.3 Running Backend Automated Test Suite
Ensure all 109 unit and integration tests pass before deploying changes:
```bash
docker compose exec backend pytest tests
# Or locally:
repo/backend/venv/bin/pytest repo/backend/tests
```

### 9.4 Rebuilding the Frontend for Production
```bash
npm --prefix repo/frontend run build
```

---

*Document prepared by Route 2 Market Solutions (Pty) Ltd for SA Healthcare platform administrators.*
