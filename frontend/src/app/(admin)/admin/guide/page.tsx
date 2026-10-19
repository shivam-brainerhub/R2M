"use client";

import { useState } from 'react';
import Link from 'next/link';

interface GuideSection {
  id: string;
  category: string;
  title: string;
  icon: string;
  summary: string;
  adminLink?: {
    href: string;
    label: string;
  };
  steps: string[];
  tips?: string[];
  codeSnippet?: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'auth-security',
    category: 'Security & Access',
    title: 'Platform Access & Admin Authentication',
    icon: 'lock',
    summary: 'How to sign in, role-based access control, session expiry, and default credentials.',
    adminLink: {
      href: '/admin/users',
      label: 'Manage Admin Users',
    },
    steps: [
      'Sign in via /login using an authorized account with the "Admin" role.',
      'Upon sign-in, the "Admin Portal" button appears in the main navbar and user dropdown menu.',
      'Non-admin visitors attempting to access /admin are automatically redirected to the home page.',
      'If your session expires (60-minute JWT token), the system redirects you to log in and returns you to your previous page.',
    ],
    tips: [
      'Change the default admin password immediately on production deployment.',
      'Admins can reset passwords for staff or suspend locked accounts in Admin > Users.',
    ],
  },
  {
    id: 'products-create',
    category: 'Products & Catalogue',
    title: 'Adding & Editing Products in the Catalogue',
    icon: 'inventory_2',
    summary: 'Manage medical devices, SKUs, clinical categories, descriptions, and publish status.',
    adminLink: {
      href: '/admin/products',
      label: 'Open Products Manager',
    },
    steps: [
      'Navigate to Admin > Products and click the "+ Add New Product" button.',
      'Enter the Product Name (e.g. Mindray BeneVision N12) and unique SKU (e.g. MN-N12-001).',
      'Select the primary Category, Subcategory, and Manufacturer Brand from the dropdowns.',
      'Assign relevant Healthcare Sectors (Hospitals, ICU, Primary Care, Emergency, etc.) to enable sector filtering.',
      'Provide a concise Short Description (used on catalogue cards) and detailed Full Description (used on product detail pages).',
      'Set Status to "Active" to publish immediately, or "Draft" to save privately while preparing specifications.',
      'Click "Save Product" to commit changes.',
    ],
    tips: [
      'You can filter by category, brand, or status directly from the product table header.',
      'Active products immediately appear in the public catalogue and live search.',
    ],
  },
  {
    id: 'multi-documents',
    category: 'Products & Catalogue',
    title: 'Attaching Official Documents & Protected Downloads',
    icon: 'folder_open',
    summary: 'Upload brochures, technical specifications, user manuals, and certificates with server-side security.',
    adminLink: {
      href: '/admin/products',
      label: 'Manage Product Documents',
    },
    steps: [
      'In the product edit modal, scroll down to the "Official Documents & Resources" section.',
      'Provide a descriptive Document Title (e.g. "BeneVision N12 Operation Manual").',
      'Select the Document Type: Brochure, Specifications, User Manual, or Certificate.',
      'Choose the PDF or DOCX file from your computer and click "Attach Document".',
      'Click "Save Product" to publish the attachments.',
    ],
    tips: [
      'Protected Download Security: The backend enforces token validation on all official documents. Visitors must sign in to download them.',
      'All uploaded documents automatically appear on the Product Detail Page, the Compare Matrix, and in the central Resource Centre (/resources).',
      'When you delete a product or document, the system automatically checks for orphaned files on disk and removes unreferenced media.',
    ],
  },
  {
    id: 'specs-properties',
    category: 'Products & Catalogue',
    title: 'Configuring Specifications & Dynamic Compare Matrix',
    icon: 'compare_arrows',
    summary: 'Set technical specifications and dynamic properties powering side-by-side product comparisons.',
    adminLink: {
      href: '/admin/products',
      label: 'Configure Specifications',
    },
    steps: [
      'Under the "Specifications" section of the product editor, add key-value pairs (e.g. "Display Size" : "12.1-inch Multi-touch").',
      'These specifications populate the Side-by-Side Product Comparison table (/compare).',
      'Under "Dynamic Properties", select filter attributes (e.g. Screen Size: 12.1", Parameters: ECG, SpO2).',
      'The catalogue sidebar aggregates these dynamic properties into multi-select refine filters automatically.',
    ],
    tips: [
      'Keep specification names consistent across similar products (e.g. always use "Display Size" rather than "Screen"). This ensures they align in the comparison matrix.',
    ],
  },
  {
    id: 'categories-brands',
    category: 'Categories & Brands',
    title: 'Managing Categories, Subcategories & Partner Brands',
    icon: 'category',
    summary: 'Organize medical departments, hierarchy, and manufacturer partner logos.',
    adminLink: {
      href: '/admin/categories',
      label: 'Open Categories & Brands',
    },
    steps: [
      'Navigate to Admin > Categories & Brands.',
      'To add/edit a Category: provide the category name and a Google Material Symbols icon name (e.g. monitor_heart, bed, sanitizer).',
      'To add a Subcategory: select the parent category and specify the subcategory name.',
      'To add a Brand (Manufacturer): enter the manufacturer name and upload their high-resolution logo.',
      'Toggle "Featured in Slider" on for brands you want visible in the homepage animated partner carousel.',
    ],
    tips: [
      'Categories with 0 products will display a zero count in the catalogue sidebar.',
      'Brands automatically display their live active product count.',
    ],
  },
  {
    id: 'quotes-workflow',
    category: 'Quotations (RFQ)',
    title: 'Quotation Workflow & Sales Pricing Management',
    icon: 'receipt_long',
    summary: 'Process customer Requests for Quote (RFQ), manage urgency, and transition status lifecycles.',
    adminLink: {
      href: '/admin/quotes',
      label: 'Review Inbound Quotes',
    },
    steps: [
      'Navigate to Admin > Quote Requests to view inbound RFQs.',
      'Click on any quote to open the detailed modal containing facility info, contact email, delivery address, and requested items.',
      'Review the requested equipment list, quantities, and customer clinical notes.',
      'Lifecycle Status Transitions:',
      '  • New: Just received from customer.',
      '  • In Review: Assigned to sales rep; verifying stock and supplier pricing.',
      '  • Quoted: Enter the formal total in the "Quoted Amount (ZAR)" field.',
      '  • Approved / Declined: Record customer decision.',
      'Add Internal Notes (visible only to administrators) and click "Update Quote".',
    ],
    tips: [
      'Customers can track the real-time status of their quotation requests in their personal account area (/profile).',
      'Each quote generates a non-sequential unique reference (e.g. QR-2026-8K4T9M).',
    ],
  },
  {
    id: 'inquiries-suppliers',
    category: 'Inquiries & Leads',
    title: 'Handling General Inquiries & Supplier Applications',
    icon: 'contact_mail',
    summary: 'Manage inbound customer contact inquiries and prospective medical equipment supplier leads.',
    adminLink: {
      href: '/admin/inquiries',
      label: 'View Leads & Messages',
    },
    steps: [
      'Navigate to Admin > Inquiries & Leads.',
      'Contact Messages: Review inquiries submitted through the /contact page. Mark status as New, In Progress, Responded, or Archived.',
      'Supplier Applications: Review international and local manufacturers applying via the Become a Supplier portal (/supplier).',
      'Inspect supplier company registration, product portfolio categories, and distribution readiness.',
    ],
    tips: [
      'All incoming inquiries display the sender’s organization and facility name for quick clinical context.',
    ],
  },
  {
    id: 'site-content-cms',
    category: 'Website Content (CMS)',
    title: 'Editing Homepage Copy, Banners & Legal Documents',
    icon: 'edit_note',
    summary: 'Update hero headlines, search terms, company phone/email, and legal terms with live preview.',
    adminLink: {
      href: '/admin/content',
      label: 'Open Content CMS',
    },
    steps: [
      'Navigate to Admin > Site Content.',
      'Homepage Hero: Customize Headline Part 1 & 2, Accent Text, Subheading, and Search Placeholder.',
      'Popular Searches: Define comma-separated keywords (e.g. Patient Monitor, Hospital Bed, ECG). These appear as 1-click pills under the search bar.',
      'Catalogue Banner: Customize the title and subtitle of the /products page.',
      'Company Information: Update phone, toll-free, email, sales email, address, and office hours. Automatically syncs with the Footer and Contact pages.',
      'Legal Documents: Use the rich text editor to edit Privacy Policy or Terms of Use. Includes live preview and "Reset to Defaults".',
    ],
    tips: [
      'Changes made in the CMS take effect immediately across the public website.',
    ],
  },
  {
    id: 'user-administration',
    category: 'Security & Access',
    title: 'Managing Staff & Client User Accounts',
    icon: 'group',
    summary: 'Create administrators, verify client emails, override passwords, and suspend accounts.',
    adminLink: {
      href: '/admin/users',
      label: 'Open User Administration',
    },
    steps: [
      'Navigate to Admin > Users.',
      'Search users by name, email, username, or organization.',
      'Click "Edit" on any user to update their role (Admin vs User), phone, or organization.',
      'Click "Suspend Account" to temporarily revoke access, or "Activate" to restore.',
      'To assist locked-out staff or clients, use "Reset Password" to set a secure new password.',
      'Click "+ Add User" to manually provision internal staff or VIP healthcare accounts.',
    ],
    tips: [
      'Only promote trusted operational staff to the "Admin" role.',
      'User accounts display organization and healthcare facility details captured at registration.',
    ],
  },
  {
    id: 'technical-ops',
    category: 'Technical Operations',
    title: 'Database Migrations, Environment & Test Execution',
    icon: 'terminal',
    summary: 'Commands and procedures for technical maintenance, migrations, and test validation.',
    steps: [
      'Running Database Migrations:',
      '  docker compose exec backend alembic upgrade head',
      'Running Automated Test Suite (109 passing tests):',
      '  docker compose exec backend pytest tests',
      'Restarting Backend Container after Configuration Changes:',
      '  docker compose restart backend',
      'Rebuilding Next.js Production Frontend:',
      '  npm --prefix repo/frontend run build',
    ],
    codeSnippet: 'docker compose exec backend alembic upgrade head\ndocker compose exec backend pytest tests\nnpm --prefix repo/frontend run build',
    tips: [
      'Always test migrations and run pytest before publishing production updates.',
    ],
  },
];

const CATEGORIES = [
  'All',
  'Security & Access',
  'Products & Catalogue',
  'Categories & Brands',
  'Quotations (RFQ)',
  'Inquiries & Leads',
  'Website Content (CMS)',
  'Technical Operations',
];

export default function AdminGuidePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'auth-security': true,
    'products-create': true,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    GUIDE_SECTIONS.forEach((s) => {
      allExpanded[s.id] = true;
    });
    setExpandedSections(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
  };

  const filteredSections = GUIDE_SECTIONS.filter((section) => {
    const matchesCategory =
      selectedCategory === 'All' || section.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.steps.some((step) => step.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (section.tips && section.tips.some((tip) => tip.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-navy rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-gold/30">
              <span className="material-symbols-outlined text-sm!">menu_book</span>
              Administrator &amp; CMS Documentation
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform Operational User Guide
            </h1>
            <p className="text-gray-300 text-sm sm:text-base mt-1 max-w-2xl font-light">
              Interactive reference for SA Healthcare and R2M staff. Learn how to manage the product catalogue, upload multi-type documents, process quotation requests, edit CMS copy, and administer users without developer dependency.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleExpandAll}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded-xl border border-white/15 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm!">unfold_more</span>
              Expand All
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded-xl border border-white/15 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm!">unfold_less</span>
              Collapse All
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg!">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guide by keyword (e.g. 'documents', 'quotes', 'specifications', 'banner', 'password')..."
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy cursor-pointer p-1"
            >
              <span className="material-symbols-outlined text-sm! block">close</span>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
            Topic:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-navy text-gold shadow-xs'
                  : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Accordion Sections */}
      <div className="space-y-4">
        {filteredSections.length > 0 ? (
          filteredSections.map((sec) => {
            const isExpanded = Boolean(expandedSections[sec.id]);

            return (
              <div
                key={sec.id}
                className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden transition-all duration-200 hover:border-gray-300"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-2xl!">{sec.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {sec.category}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-navy">
                        {sec.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-0.5 leading-relaxed">
                        {sec.summary}
                      </p>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-gray-400 text-xl! shrink-0 mt-2 transition-transform duration-200">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-gray-100 space-y-5 bg-white">
                    {/* Action Shortcut */}
                    {sec.adminLink && (
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">
                          Ready to make changes?
                        </span>
                        <Link
                          href={sec.adminLink.href}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-navy bg-gold/20 hover:bg-gold-bright hover:text-navy px-3.5 py-1.5 rounded-lg border border-gold/40 transition-all active:scale-95 shadow-2xs"
                        >
                          <span>{sec.adminLink.label}</span>
                          <span className="material-symbols-outlined text-sm!">arrow_forward</span>
                        </Link>
                      </div>
                    )}

                    {/* Step-by-Step Instructions */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm! text-blue-600">
                          format_list_numbered
                        </span>
                        <span>Step-by-Step Instructions</span>
                      </h4>
                      <ol className="space-y-2 text-xs sm:text-sm text-gray-700 list-decimal list-inside pl-1 leading-relaxed">
                        {sec.steps.map((step, idx) => (
                          <li key={idx} className="pl-1">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Code Snippet if technical */}
                    {sec.codeSnippet && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm! text-purple-600">
                            terminal
                          </span>
                          <span>Command Line Execution</span>
                        </h4>
                        <pre className="bg-navy text-gold p-3.5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-white/10">
                          {sec.codeSnippet}
                        </pre>
                      </div>
                    )}

                    {/* Pro Tips / Compliance Notes */}
                    {sec.tips && sec.tips.length > 0 && (
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-amber-800">
                          <span className="material-symbols-outlined text-sm! text-amber-600">
                            lightbulb
                          </span>
                          <span>Important Tips &amp; Compliance Notes</span>
                        </div>
                        <ul className="space-y-1 list-disc list-inside pl-1 text-amber-900/90 leading-relaxed">
                          {sec.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <span className="material-symbols-outlined text-4xl! text-gray-400 mb-2 block">
              search_off
            </span>
            <h3 className="text-base font-bold text-navy">No guide topics match your search</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Try searching for terms like &quot;product&quot;, &quot;quote&quot;, &quot;brochure&quot;, or click &quot;All&quot; to clear category filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-4 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-light transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Quick Help Footer Card */}
      <div className="bg-linear-to-r from-navy via-navy to-navy-light text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-white/10">
        <div>
          <h3 className="text-lg font-bold">Have Questions or Require Technical Support?</h3>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
            This platform was engineered by Route 2 Market Solutions (Pty) Ltd. For system configuration questions or assistance with bulk data imports, contact the development lead.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/admin"
            className="bg-gold hover:bg-gold-bright text-navy font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
