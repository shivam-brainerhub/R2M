import { HeroContent, CompanyContent, WhyUsContent, CTAContent } from './api';

export const DEFAULT_HERO: HeroContent = {
  headlinePart1: 'Healthcare',
  headlinePart2: 'without',
  headlineAccent: 'limits.',
  subheading:
    "Explore SA Healthcare's growing digital healthcare catalogue. Search products, brochures and technical specifications from trusted global manufacturers.",
  showSearchBar: true,
  searchPlaceholder:
    'Search by product, model number, manufacturer, brochure or technical specification...',
  popularSearches: [
    'Patient Monitor',
    'Hospital Bed',
    'ECG',
    'Pulse Oximeter',
    'Infusion Pump',
    'Defibrillator',
    'Ultrasound',
  ],
  badgeTitle: 'TRUST • ACCESS • INNOVATION • IMPACT',
  badgeTagline: 'A HEALTHIER TOMORROW TOGETHER.',
};

export const DEFAULT_COMPANY: CompanyContent = {
  companyName: 'SA Healthcare',
  phone: '+27 11 555 0100',
  tollFree: '0800 123 456',
  email: 'info@sahealthcare.com',
  salesEmail: 'quotes@sahealthcare.com',
  physicalAddress: '15 Medical Boulevard, Sandton, Johannesburg, 2196, South Africa',
  hours: 'Monday – Friday: 08:00 – 17:00 (SAST)',
};

export const DEFAULT_WHY_US: WhyUsContent = {
  sectionTag: 'WHY SA HEALTHCARE',
  title: 'Why choose SA Healthcare',
  items: [
    {
      id: '1',
      icon: 'language',
      title: 'Trusted Global Manufacturers',
      description: 'A comprehensive range of products from leading brands worldwide.',
    },
    {
      id: '2',
      icon: 'description',
      title: 'Brochures & Technical Information',
      description: 'Every product includes brochures and technical specifications.',
    },
    {
      id: '3',
      icon: 'chat',
      title: 'Request a Quote',
      description: 'Receive personalised assistance from our healthcare specialists.',
    },
  ],
};

export const DEFAULT_CTA: CTAContent = {
  heading: 'Need a quotation or product advice?',
  subheading:
    'Speak to our team for expert guidance and tailored solutions for your facility.',
  buttonText: 'Request a Quote',
  buttonLink: '/quote',
  phone: '+27 11 555 0100',
  email: 'info@sahealthcare.com',
};

export const CATEGORY_ICON_MAP: Record<string, string> = {
  'diagnostic-and-measure': 'monitor_heart',
  'furniture': 'bed',
  'disposables-and-care-supplies': 'clean_hands',
  'hygiene-and-sterilisation': 'sanitizer',
  'hygiene-disinfection-and-sterilisation': 'sanitizer',
  'emergency-reanimation-and-surgery': 'medical_services',
  'living-aid': 'accessible',
  'instruments': 'content_cut',
  'lab': 'science',
  'veterinary': 'pets',
};
