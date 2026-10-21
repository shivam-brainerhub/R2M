import {
  CompanyContent,
  CTAContent,
  HeroContent,
  LegalContent,
  ProductsPageContent,
  WhyUsContent,
} from "./api";

export const DEFAULT_HERO: HeroContent = {
  headlinePart1: "Healthcare",
  headlinePart2: "without",
  headlineAccent: "limits.",
  subheading:
    "Explore SA Healthcare's growing digital healthcare catalogue. Search products, brochures and technical specifications from trusted global manufacturers.",
  showSearchBar: true,
  searchPlaceholder:
    "Search by product, model number, manufacturer, brochure or technical specification...",
  popularSearches: [
    "Patient Monitor",
    "Hospital Bed",
    "ECG",
    "Pulse Oximeter",
    "Infusion Pump",
    "Defibrillator",
    "Ultrasound",
  ],
  badgeTitle: "TRUST • ACCESS • INNOVATION • IMPACT",
  badgeTagline: "A HEALTHIER TOMORROW TOGETHER.",
};

export const DEFAULT_PRODUCTS_PAGE: ProductsPageContent = {
  title: "Browse the Catalogue",
  subtitle:
    "Explore our range of medical products from trusted global manufacturers.",
  searchPlaceholder: "Search by product, model number, manufacturer...",
  popularSearches: [
    "Patient Monitor",
    "Hospital Bed",
    "ECG",
    "Pulse Oximeter",
    "Infusion Pump",
    "Defibrillator",
    "Ultrasound",
  ],
};

export const DEFAULT_COMPANY: CompanyContent = {
  companyName: "SA Healthcare",
  phone: "+27 11 555 0100",
  tollFree: "0800 123 456",
  email: "info@sahealthcare.com",
  salesEmail: "quotes@sahealthcare.com",
  physicalAddress:
    "15 Medical Boulevard, Sandton, Johannesburg, 2196, South Africa",
  hours: "Monday – Friday: 08:00 – 17:00 (SAST)",
};

export const DEFAULT_WHY_US: WhyUsContent = {
  sectionTag: "WHY SA HEALTHCARE",
  title: "Why choose SA Healthcare",
  items: [
    {
      id: "1",
      icon: "language",
      title: "Trusted Global Manufacturers",
      description:
        "A comprehensive range of products from leading brands worldwide.",
    },
    {
      id: "2",
      icon: "description",
      title: "Brochures & Technical Information",
      description:
        "Every product includes brochures and technical specifications.",
    },
    {
      id: "3",
      icon: "chat",
      title: "Request a Quote",
      description:
        "Receive personalised assistance from our healthcare specialists.",
    },
  ],
};

export const DEFAULT_CTA: CTAContent = {
  heading: "Need a quotation or product advice?",
  subheading:
    "Speak to our team for expert guidance and tailored solutions for your facility.",
  buttonText: "Request a Quote",
  buttonLink: "/quote",
  phone: "+27 11 555 0100",
  email: "info@sahealthcare.com",
};

export const CATEGORY_ICON_MAP: Record<string, string> = {
  "diagnostic-and-measure": "monitor_heart",
  furniture: "bed",
  "disposables-and-care-supplies": "clean_hands",
  "hygiene-and-sterilisation": "sanitizer",
  "hygiene-disinfection-and-sterilisation": "sanitizer",
  "emergency-reanimation-and-surgery": "medical_services",
  "living-aid": "accessible",
  instruments: "content_cut",
  lab: "science",
  veterinary: "pets",
};

export const DEFAULT_PRIVACY_POLICY: LegalContent = {
  title: "Privacy Policy",
  subtitle:
    "How SA Healthcare collects, protects, and handles your personal information in compliance with POPIA.",
  lastUpdated: "October 2026",
  content: `<h2>1. Commitment to Privacy</h2>
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
<p>If you have questions regarding this Privacy Policy or wish to exercise your data subject rights, please contact our Information Office at <a href="mailto:info@sahealthcare.com">info@sahealthcare.com</a> or +27 11 555 0100 (15 Medical Boulevard, Sandton, Johannesburg).</p>`,
};

export const DEFAULT_TERMS_OF_USE: LegalContent = {
  title: "Terms of Use",
  subtitle:
    "Terms governing the use of the SA Healthcare digital equipment catalogue and quote request system.",
  lastUpdated: "October 2026",
  content: `<h2>1. Acceptance of Terms</h2>
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
<p>For commercial agreements, tender submissions, or warranty inquiries, contact our commercial department at <a href="mailto:quotes@sahealthcare.com">quotes@sahealthcare.com</a> or +27 11 555 0100 (15 Medical Boulevard, Sandton, Johannesburg).</p>`,
};
