"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PermissionSection } from '@/lib/api';

interface GuideSection {
  id: string;
  category: string;
  title: string;
  icon: string;
  summary: string;
  section?: PermissionSection;
  adminOnly?: boolean;
  minLevel?: 'read' | 'write';
  adminLink?: {
    href: string;
    label: string;
    writeLabel?: string;
    readLabel?: string;
  };
  steps: string[];
  readOnlySteps?: string[];
  tips?: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'portal-overview',
    category: 'Getting Started',
    title: 'Staff Portal Overview & Account Navigation',
    icon: 'dashboard',
    summary: 'Understand your role-based workspace, live notification badges, and personal profile settings.',
    adminLink: {
      href: '/portal/profile',
      label: 'Open Account Profile',
      writeLabel: 'Manage Profile',
      readLabel: 'View Profile',
    },
    steps: [
      'The portal navigation sidebar automatically adapts to your role, displaying only the modules you are authorized to access.',
      'Active badge counters on sidebar links highlight incoming items requiring staff action (such as new RFQ requests or inquiries).',
      'To review your account credentials or update your name, email, phone number, and password, click your profile link at the bottom of the sidebar.',
      'Your session remains active across secure navigation. If left idle for 60 minutes, the portal will prompt you to re-authenticate to protect sensitive clinical data.',
    ],
    tips: [
      'If you need access to an additional operational section (such as Quotations or Products), contact your platform Administrator to adjust your role permissions.',
    ],
  },
  {
    id: 'products-catalogue',
    category: 'Products & Catalogue',
    section: 'products',
    title: 'Adding & Managing Medical Equipment in Catalogue',
    icon: 'inventory_2',
    summary: 'Browse medical devices, manage SKUs, clinical categories, descriptions, and publish status.',
    adminLink: {
      href: '/portal/products',
      label: 'Open Products',
      writeLabel: 'Manage Products',
      readLabel: 'Browse Catalogue',
    },
    steps: [
      'Navigate to Products from the sidebar and click the "+ Add New Product" button.',
      'Enter the Product Name (e.g. Mindray BeneVision N12) and unique SKU (e.g. MN-N12-001).',
      'Select the primary Category, Subcategory, and Manufacturer Brand from the dropdowns.',
      'Assign relevant Healthcare Sectors (Hospitals, ICU, Primary Care, Emergency, etc.) to enable sector filtering.',
      'Provide a concise Short Description (used on catalogue cards) and detailed Full Description (used on product detail pages).',
      'Set Status to "Active" to publish immediately, or "Draft" to save privately while preparing specifications.',
      'Click "Save Product" to commit changes.',
    ],
    readOnlySteps: [
      'Navigate to Products from the sidebar to inspect the active medical equipment inventory.',
      'Use the category, brand, and status filter dropdowns or search query to quickly locate devices.',
      'Click "View" on any product card or row to open the complete specification sheet.',
      'Inspect clinical descriptions, attached brochures, and technical specs in read-only mode.',
    ],
    tips: [
      'Active products immediately appear in the public catalogue and live search.',
      'You can filter by category, brand, or status directly from the product table header.',
    ],
  },
  {
    id: 'multi-documents',
    category: 'Products & Catalogue',
    section: 'products',
    title: 'Attaching Official Documents & Protected Downloads',
    icon: 'folder_open',
    summary: 'Upload brochures, technical specifications, user manuals, and certificates with server-side security.',
    adminLink: {
      href: '/portal/products',
      label: 'Product Documents',
      writeLabel: 'Manage Product Documents',
      readLabel: 'View Product Documents',
    },
    steps: [
      'In the product edit modal, scroll down to the "Official Documents & Resources" section.',
      'Provide a descriptive Document Title (e.g. "BeneVision N12 Operation Manual").',
      'Select the Document Type: Brochure, Specifications, User Manual, or Certificate.',
      'Choose the PDF or DOCX file from your computer and click "Attach Document".',
      'Click "Save Product" to publish the attachments.',
    ],
    readOnlySteps: [
      'Open any product in the catalogue and scroll to the "Official Documents & Resources" section.',
      'Inspect available user manuals, technical data sheets, and regulatory certificates.',
      'Click on any document link to securely preview or download the file.',
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
    section: 'products',
    title: 'Configuring Specifications & Dynamic Compare Matrix',
    icon: 'compare_arrows',
    summary: 'Set technical specifications and dynamic properties powering side-by-side product comparisons.',
    adminLink: {
      href: '/portal/products',
      label: 'Product Specifications',
      writeLabel: 'Configure Specifications',
      readLabel: 'Inspect Specifications',
    },
    steps: [
      'Under the "Specifications" section of the product editor, add key-value pairs (e.g. "Display Size" : "12.1-inch Multi-touch").',
      'These specifications populate the Side-by-Side Product Comparison table (/compare).',
      'Under "Dynamic Properties", select filter attributes (e.g. Screen Size: 12.1", Parameters: ECG, SpO2).',
      'The catalogue sidebar aggregates these dynamic properties into multi-select refine filters automatically.',
    ],
    readOnlySteps: [
      'Open the product detail modal and view the "Specifications" table to see clinical attributes.',
      'Inspect side-by-side attributes such as Display Size, Battery Life, and Clinical Parameters.',
      'Review dynamic filter properties assigned to each device.',
    ],
    tips: [
      'Keep specification names consistent across similar products (e.g. always use "Display Size" rather than "Screen"). This ensures they align in the comparison matrix.',
    ],
  },
  {
    id: 'categories-brands',
    category: 'Categories & Brands',
    section: 'categories',
    title: 'Managing Categories, Subcategories & Partner Brands',
    icon: 'category',
    summary: 'Organize medical clinical departments, hierarchy, and manufacturer partner logos.',
    adminLink: {
      href: '/portal/categories',
      label: 'Categories & Brands',
      writeLabel: 'Manage Categories & Brands',
      readLabel: 'Browse Categories & Brands',
    },
    steps: [
      'Navigate to Categories & Brands in the sidebar.',
      'To add/edit a Category: provide the category name and a Google Material Symbols icon name (e.g. monitor_heart, bed, sanitizer).',
      'To add a Subcategory: select the parent category and specify the subcategory name.',
      'To add a Brand (Manufacturer): enter the manufacturer name and upload their high-resolution logo.',
      'Toggle "Featured in Slider" on for brands you want visible in the homepage animated partner carousel.',
    ],
    readOnlySteps: [
      'Navigate to Categories & Brands to review clinical department taxonomy and brand partners.',
      'Inspect parent categories and associated subcategories.',
      'View active manufacturer partner accounts and which brands are featured in the homepage slider.',
    ],
    tips: [
      'Categories with 0 products display a zero count in the catalogue sidebar.',
      'Brands automatically display their live active product count.',
    ],
  },
  {
    id: 'quotes-workflow',
    category: 'Quotations (RFQ)',
    section: 'quotes',
    title: 'Quotation Workflow & Sales Pricing Management',
    icon: 'receipt_long',
    summary: 'Process customer Requests for Quote (RFQ), manage urgency, and transition status lifecycles.',
    adminLink: {
      href: '/portal/quotes',
      label: 'Quote Requests',
      writeLabel: 'Process Quote Requests',
      readLabel: 'View Quote Requests',
    },
    steps: [
      'Navigate to Quote Requests in the sidebar to view inbound RFQs.',
      'Click on any quote to open the detailed modal containing facility info, contact email, delivery address, and requested items.',
      'Review the requested equipment list, quantities, and customer clinical notes.',
      'Lifecycle Status Transitions:',
      '  • New: Just received from customer.',
      '  • In Review: Assigned to sales rep; verifying stock and supplier pricing.',
      '  • Quoted: Enter the formal total in the "Quoted Amount (ZAR)" field.',
      '  • Approved / Declined: Record customer decision.',
      'Add Internal Notes (visible only to staff) and click "Update Quote".',
    ],
    readOnlySteps: [
      'Navigate to Quote Requests in the sidebar to inspect inbound customer RFQs.',
      'Click on any quotation row to view requested medical devices, facility location, and customer notes.',
      'Inspect the quote status (New, In Review, Quoted, Approved, Declined) and quoted pricing.',
    ],
    tips: [
      'Customers can track the real-time status of their quotation requests in their personal account area (/profile).',
      'Each quote generates a non-sequential unique reference (e.g. QR-2026-8K4T9M).',
    ],
  },
  {
    id: 'inquiries-suppliers',
    category: 'Inquiries & Leads',
    section: 'inquiries',
    title: 'Handling General Inquiries & Supplier Applications',
    icon: 'contact_mail',
    summary: 'Manage inbound customer contact inquiries and prospective medical equipment supplier leads.',
    adminLink: {
      href: '/portal/inquiries',
      label: 'Inquiries & Leads',
      writeLabel: 'Manage Leads & Messages',
      readLabel: 'View Leads & Messages',
    },
    steps: [
      'Navigate to Inquiries & Leads in the sidebar.',
      'Contact Messages: Review inquiries submitted through the contact form. Update status to New, In Progress, Responded, or Archived.',
      'Supplier Applications: Review international and local manufacturers applying via the Become a Supplier portal.',
      'Inspect supplier company registration, product portfolio categories, and distribution readiness.',
      'Add staff notes to track correspondence history and follow-up milestones.',
    ],
    readOnlySteps: [
      'Navigate to Inquiries & Leads to inspect messages and partner applications.',
      'Review sender facility details, message contents, and current status.',
      'Inspect supplier applications and company profiles submitted for review.',
    ],
    tips: [
      'All incoming inquiries display the sender’s organization and facility name for quick clinical context.',
    ],
  },
  {
    id: 'site-content-cms',
    category: 'Website Content (CMS)',
    section: 'content',
    title: 'Editing Homepage Copy, Banners & Legal Documents',
    icon: 'edit_note',
    summary: 'Update hero headlines, search terms, company phone/email, and legal terms with live preview.',
    adminLink: {
      href: '/portal/content',
      label: 'Site Content',
      writeLabel: 'Open Content CMS',
      readLabel: 'View Content CMS',
    },
    steps: [
      'Navigate to Site Content in the sidebar.',
      'Homepage Hero: Customize Headline Part 1 & 2, Accent Text, Subheading, and Search Placeholder.',
      'Popular Searches: Define comma-separated keywords (e.g. Patient Monitor, Hospital Bed, ECG). These appear as 1-click pills under the search bar.',
      'Catalogue Banner: Customize the title and subtitle of the /products page.',
      'Company Information: Update phone, toll-free, email, sales email, address, and office hours. Automatically syncs with the Footer and Contact pages.',
      'Legal Documents: Use the rich text editor to edit Privacy Policy or Terms of Use. Includes live preview and "Reset to Defaults".',
    ],
    readOnlySteps: [
      'Navigate to Site Content to preview active website copy and settings.',
      'Inspect homepage hero text, popular search keywords, and contact details.',
      'Review current legal documents and terms.',
    ],
    tips: [
      'Changes made in the CMS take effect immediately across the public website.',
    ],
  },
  {
    id: 'user-administration',
    category: 'User Management',
    section: 'users',
    title: 'Managing Staff & Hospital Accounts',
    icon: 'group',
    summary: 'Create staff accounts, verify emails, manage credentials, and suspend or activate accounts.',
    adminLink: {
      href: '/portal/users',
      label: 'User Accounts',
      writeLabel: 'Open User Management',
      readLabel: 'View User Accounts',
    },
    steps: [
      'Navigate to Users in the sidebar.',
      'Search users by name, email, username, or hospital organization.',
      'Click "Edit" on any user to update their role, contact details, or assigned permissions.',
      'Click "Suspend Account" to temporarily revoke access, or "Activate" to restore.',
      'Use "Reset Password" to generate a secure new credential for locked-out staff or clients.',
      'Click "+ Add User" to manually provision internal staff or VIP healthcare accounts.',
    ],
    readOnlySteps: [
      'Navigate to Users to view the directory of staff and client accounts.',
      'Search and filter accounts by role, verification status, and organization.',
      'Click "View Details" to inspect user registration date, email status, and assigned profile.',
    ],
    tips: [
      'Only promote trusted operational personnel to privileged administrative roles.',
    ],
  },
  {
    id: 'roles-management',
    category: 'Roles & IAM',
    section: 'roles',
    adminOnly: true,
    title: 'Role-Based Access Control & Permission Profiles',
    icon: 'shield_person',
    summary: 'Configure system roles, fine-grained module access (read/write/none), and staff permissions.',
    adminLink: {
      href: '/portal/roles',
      label: 'Manage Roles & Permissions',
      writeLabel: 'Configure Roles & IAM',
      readLabel: 'View Roles & IAM',
    },
    steps: [
      'Navigate to Roles & Permissions in the sidebar (Admin only).',
      'Review standard system roles: Administrator, Sales Representative, Product Manager, Content Editor, and Support Agent.',
      'Create new roles or customize permissions across Quotes, Products, Categories, Inquiries, Content, and Users.',
      'Set permission levels: None (hidden), Read (view-only), or Write (full create, edit, delete).',
      'Staff members only see sidebar links and guide documentation matching their assigned permissions.',
    ],
    tips: [
      'Custom per-user permissions can also be assigned in User Management to override role defaults.',
      'Role updates take effect immediately on next authentication.',
    ],
  },
];

export default function AdminGuidePage() {
  const { user, hasPermission, isAdmin, isLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'portal-overview': true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  // Filter sections strictly according to user permissions
  const visibleSections = GUIDE_SECTIONS.filter((sec) => {
    if (isAdmin) return true;
    if (sec.adminOnly) return false;
    if (!sec.section) return true; // General topic available to all portal staff
    return hasPermission(sec.section, sec.minLevel || 'read');
  });

  // Extract only categories that have at least one visible section for this user
  const availableCategories = ['All', ...Array.from(new Set(visibleSections.map((s) => s.category)))];
  const activeCategory = availableCategories.includes(selectedCategory) ? selectedCategory : 'All';

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    visibleSections.forEach((s) => {
      allExpanded[s.id] = true;
    });
    setExpandedSections(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
  };

  const filteredSections = visibleSections.filter((section) => {
    const matchesCategory = activeCategory === 'All' || section.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesQuery =
      section.title.toLowerCase().includes(q) ||
      section.summary.toLowerCase().includes(q) ||
      section.category.toLowerCase().includes(q) ||
      section.steps.some((step) => step.toLowerCase().includes(q)) ||
      (section.readOnlySteps && section.readOnlySteps.some((step) => step.toLowerCase().includes(q))) ||
      (section.tips && section.tips.some((tip) => tip.toLowerCase().includes(q)));

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
              {isAdmin ? 'Administrator Guide' : `${user?.role_name || user?.role || 'Staff'} Knowledge Base`}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isAdmin ? 'Platform Operational User Guide' : `${user?.role_name || user?.role || 'Staff'} Operational Guide`}
            </h1>
            <p className="text-gray-300 text-sm sm:text-base mt-1 max-w-2xl font-light">
              {isAdmin
                ? 'Comprehensive operational reference for platform administrators. Manage medical catalogue, quotation RFQs, partner leads, CMS content, users, and security permissions.'
                : `Tailored operational reference for your account. Displaying only the guides and procedures for modules you have permission to access.`}
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
            placeholder="Search guide by keyword (e.g. 'documents', 'quotes', 'specifications', 'banner')..."
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
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat
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
            const canWrite = sec.section
              ? (isAdmin || hasPermission(sec.section, 'write'))
              : true;
            const stepsToDisplay = (!canWrite && sec.readOnlySteps) ? sec.readOnlySteps : sec.steps;

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
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {sec.category}
                        </span>
                        {sec.section && (
                          canWrite ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]!">edit</span>
                              Full Access
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[11px]!">visibility</span>
                              View Only
                            </span>
                          )
                        )}
                        {sec.adminOnly && (
                          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]!">shield_person</span>
                            Admin Only
                          </span>
                        )}
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
                          Ready to {canWrite ? 'take action' : 'view records'}?
                        </span>
                        <Link
                          href={sec.adminLink.href}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-navy bg-gold/20 hover:bg-gold-bright hover:text-navy px-3.5 py-1.5 rounded-lg border border-gold/40 transition-all active:scale-95 shadow-2xs"
                        >
                          <span>
                            {canWrite
                              ? (sec.adminLink.writeLabel || sec.adminLink.label)
                              : (sec.adminLink.readLabel || sec.adminLink.label)}
                          </span>
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
                        {stepsToDisplay.map((step, idx) => (
                          <li key={idx} className="pl-1">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

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
              Try searching for different terms or reset your filters to see all available topics.
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
            href="/portal"
            className="bg-gold hover:bg-gold-bright text-navy font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
