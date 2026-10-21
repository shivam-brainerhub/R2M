"use client";

import QuoteDetailsModal, {
  getStatusBadge,
} from "@/components/admin/QuoteDetailsModal";
import { useAuth } from "@/context/AuthContext";
import {
  ContactMessageItem,
  getMediaUrl,
  inquiriesApi,
  InquiriesStatsResponse,
  ProductItem,
  productsApi,
  ProductStatsResponse,
  QuoteItemData,
  QuoteRequestData,
  quotesApi,
  QuoteStatsData,
} from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const { user, token, hasPermission, isAdmin, isLoading } = useAuth();

  const canReadQuotes = isAdmin || hasPermission("quotes", "read");
  const canWriteQuotes = isAdmin || hasPermission("quotes", "write");
  const canReadProducts = isAdmin || hasPermission("products", "read");
  const canWriteProducts = isAdmin || hasPermission("products", "write");
  const canReadCategories = isAdmin || hasPermission("categories", "read");
  const canWriteCategories = isAdmin || hasPermission("categories", "write");
  const canReadInquiries = isAdmin || hasPermission("inquiries", "read");
  const canWriteInquiries = isAdmin || hasPermission("inquiries", "write");
  const canReadContent = isAdmin || hasPermission("content", "read");
  const canWriteContent = isAdmin || hasPermission("content", "write");
  const canReadUsers = isAdmin || hasPermission("users", "read");
  const canWriteUsers = isAdmin || hasPermission("users", "write");

  const [productStats, setProductStats] = useState<ProductStatsResponse | null>(
    null,
  );
  const [liveProducts, setLiveProducts] = useState<ProductItem[]>([]);
  const [quoteStats, setQuoteStats] = useState<QuoteStatsData | null>(null);
  const [liveQuotes, setLiveQuotes] = useState<QuoteRequestData[]>([]);
  const [inquiriesStats, setInquiriesStats] =
    useState<InquiriesStatsResponse | null>(null);
  const [liveInquiries, setLiveInquiries] = useState<ContactMessageItem[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequestData | null>(
    null,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuoteUpdated = (updated: QuoteRequestData) => {
    setLiveQuotes((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q)),
    );
  };

  const getInquiryStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "In Progress":
      case "Under Review":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Responded":
      case "Approved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Archived":
      case "Declined":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  useEffect(() => {
    if (isLoading || !token) return;

    let active = true;

    if (canReadProducts) {
      productsApi
        .getStats()
        .then((data) => {
          if (active) setProductStats(data);
        })
        .catch(() => {});

      productsApi
        .listProducts({ limit: 4 })
        .then((data) => {
          if (active) setLiveProducts(data);
        })
        .catch(() => {});
    }

    if (token && canReadQuotes) {
      quotesApi
        .getQuoteStats(token)
        .then((data) => {
          if (active) setQuoteStats(data);
        })
        .catch(() => {});

      quotesApi
        .listQuotes(token, { limit: 4 })
        .then((data) => {
          if (active) setLiveQuotes(data);
        })
        .catch(() => {});
    }

    if (token && canReadInquiries) {
      inquiriesApi
        .getInquiriesStats(token)
        .then((data) => {
          if (active) setInquiriesStats(data);
        })
        .catch(() => {});

      inquiriesApi
        .listContactMessages(token, { limit: 4 })
        .then((data) => {
          if (active) setLiveInquiries(data);
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [isLoading, token, canReadQuotes, canReadProducts, canReadInquiries]);

  // Dynamically assemble KPI cards based strictly on user's authorized modules
  const statsCards: Array<{
    title: string;
    value: string;
    change: string;
    icon: string;
    color: string;
    bg: string;
    link: string;
  }> = [];

  if (canReadQuotes) {
    statsCards.push({
      title: "Quote Requests",
      value: quoteStats
        ? String(quoteStats.total_quotes)
        : liveQuotes.length
          ? String(liveQuotes.length)
          : "0",
      change: quoteStats
        ? `${quoteStats.new_quotes} new, ${quoteStats.in_review_quotes} in review`
        : "RFQ enquiries",
      icon: "receipt_long",
      color: "text-amber-600",
      bg: "bg-amber-50",
      link: "/portal/quotes",
    });
  }

  if (canReadProducts) {
    statsCards.push({
      title: "Total Products",
      value: productStats
        ? String(productStats.total_products)
        : liveProducts.length
          ? String(liveProducts.length)
          : "0",
      change: productStats
        ? `${productStats.active_products} active, ${productStats.draft_products} draft`
        : "Medical catalogue",
      icon: "inventory_2",
      color: "text-blue-600",
      bg: "bg-blue-50",
      link: "/portal/products",
    });
    statsCards.push({
      title: "Brochures",
      value: productStats ? String(productStats.with_brochure_count) : "0",
      change: "Attached spec sheets",
      icon: "picture_as_pdf",
      color: "text-red-600",
      bg: "bg-red-50",
      link: "/portal/products",
    });
  }

  if (canReadCategories || (canReadProducts && productStats?.total_brands)) {
    statsCards.push({
      title: "Active Brands",
      value: productStats ? String(productStats.total_brands) : "—",
      change: "Partner manufacturers",
      icon: "domain",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      link: canReadCategories ? "/portal/categories" : "/portal/products",
    });
  }

  if (canReadInquiries) {
    const totalInquiries = inquiriesStats
      ? inquiriesStats.total_contact + inquiriesStats.total_supplier
      : liveInquiries.length;
    const newInquiries = inquiriesStats?.total_new ?? 0;
    statsCards.push({
      title: "Inquiries & Leads",
      value: String(totalInquiries),
      change: inquiriesStats
        ? `${newInquiries} new pending`
        : "Customer messages",
      icon: "mail",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      link: "/portal/inquiries",
    });
  }

  const statsGridClass =
    statsCards.length === 1
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      : statsCards.length === 2
        ? "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
        : statsCards.length === 3
          ? "grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6";

  // Section Renderers
  const renderQuotesSection = (colSpan: string = "lg:col-span-2") => (
    <div
      className={`${colSpan} bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col`}
    >
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-navy text-base sm:text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-xl!">
              notifications_active
            </span>
            Recent Quote Requests
          </h2>
          <p className="text-xs text-gray-500">
            Incoming healthcare requests requiring sales quote responses.
          </p>
        </div>
        <Link
          href="/portal/quotes"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <span>See All</span>
          <span className="material-symbols-outlined text-sm!">
            arrow_forward
          </span>
        </Link>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-100">
            <tr>
              <th className="px-5 py-3">Quote ID &amp; Facility</th>
              <th className="px-4 py-3">Requested Items</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {liveQuotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  No incoming quote requests yet.
                </td>
              </tr>
            ) : (
              liveQuotes.map((q: QuoteRequestData) => (
                <tr
                  key={q.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-navy">{q.facility_name}</div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {q.quote_number} &bull; {q.contact_name}
                    </div>
                  </td>
                  <td
                    className="px-4 py-4 text-gray-600 max-w-xs truncate"
                    title={q.items
                      .map(
                        (it: QuoteItemData) =>
                          `${it.product_name} (x${it.quantity})`,
                      )
                      .join(", ")}
                  >
                    {q.items
                      .map(
                        (it: QuoteItemData) =>
                          `${it.product_name} (x${it.quantity})`,
                      )
                      .join(", ")}
                  </td>
                  <td className="px-4 py-4 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(q.created_at).toLocaleDateString("en-ZA", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusBadge(
                        q.status,
                      )}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedQuote(q)}
                      className="text-xs font-semibold text-navy bg-slate-100 hover:bg-gold hover:text-navy px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Review</span>
                      <span className="material-symbols-outlined text-xs!">
                        visibility
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInquiriesSection = (colSpan: string = "lg:col-span-2") => (
    <div
      className={`${colSpan} bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col`}
    >
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-navy text-base sm:text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-xl!">
              mark_email_unread
            </span>
            Recent Inquiries &amp; Leads
          </h2>
          <p className="text-xs text-gray-500">
            Incoming inquiries from healthcare facilities, doctors, and
            partners.
          </p>
        </div>
        <Link
          href="/portal/inquiries"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <span>See All</span>
          <span className="material-symbols-outlined text-sm!">
            arrow_forward
          </span>
        </Link>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-100">
            <tr>
              <th className="px-5 py-3">Contact &amp; Facility</th>
              <th className="px-4 py-3">Message Snippet</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {liveInquiries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                  No incoming inquiries yet.
                </td>
              </tr>
            ) : (
              liveInquiries.slice(0, 4).map((msg) => (
                <tr
                  key={msg.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="font-bold text-navy">
                      {`${msg.first_name || ""} ${
                        msg.last_name || ""
                      }`.trim() || "Anonymous"}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[180px]">
                      {msg.organization || msg.email}
                    </div>
                  </td>
                  <td
                    className="px-4 py-4 text-gray-600 max-w-xs truncate"
                    title={msg.message}
                  >
                    {msg.message}
                  </td>
                  <td className="px-4 py-4 text-gray-500 whitespace-nowrap text-xs">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleDateString("en-ZA", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getInquiryStatusBadge(
                        msg.status,
                      )}`}
                    >
                      {msg.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <Link
                      href="/portal/inquiries"
                      className="text-xs font-semibold text-navy bg-slate-100 hover:bg-gold hover:text-navy px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1"
                    >
                      <span>View</span>
                      <span className="material-symbols-outlined text-xs!">
                        arrow_forward
                      </span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProductsWidget = () => (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <h2 className="font-bold text-navy text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-xl!">
              inventory
            </span>
            Live Products
          </h2>
          <Link
            href="/portal/products"
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Manage ({productStats?.total_products ?? liveProducts.length})
          </Link>
        </div>

        <div className="space-y-3">
          {liveProducts.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">
              No products found.
            </p>
          ) : (
            liveProducts.map((p: ProductItem) => {
              const img =
                p.primary_image_url ||
                p.images[0]?.image_url ||
                "/images/benevision_n12.jpg";

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 relative overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <Image
                        src={getMediaUrl(img)}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    </div>
                    <div className="truncate">
                      <Link
                        href={`/products/${p.slug}`}
                        target="_blank"
                        className="text-xs font-bold text-navy hover:text-blue-600 truncate block"
                      >
                        {p.name}
                      </Link>
                      <div className="text-[11px] text-gray-400 uppercase font-semibold">
                        {p.brand_name || "Generic"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === "Active"
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-gray-600 bg-gray-100"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const renderProductsSection = (colSpan: string = "lg:col-span-2") => (
    <div
      className={`${colSpan} bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-navy text-base sm:text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-xl!">
                inventory_2
              </span>
              Medical Equipment Catalogue
            </h2>
            <p className="text-xs text-gray-500">
              Live products and medical devices currently published on the
              platform.
            </p>
          </div>
          <Link
            href="/portal/products"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>
              Manage Catalogue (
              {productStats?.total_products ?? liveProducts.length})
            </span>
            <span className="material-symbols-outlined text-sm!">
              arrow_forward
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {liveProducts.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center col-span-2">
              No products found in catalogue.
            </p>
          ) : (
            liveProducts.map((p: ProductItem) => {
              const img =
                p.primary_image_url ||
                p.images[0]?.image_url ||
                "/images/benevision_n12.jpg";
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 relative overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <Image
                        src={getMediaUrl(img)}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    </div>
                    <div className="truncate">
                      <Link
                        href={`/products/${p.slug}`}
                        target="_blank"
                        className="text-xs font-bold text-navy hover:text-blue-600 truncate block"
                      >
                        {p.name}
                      </Link>
                      <div className="text-[11px] text-gray-400 uppercase font-semibold">
                        {p.brand_name || "Generic"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === "Active"
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-gray-600 bg-gray-100"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const renderWorkspaceOverviewSection = (
    colSpan: string = "lg:col-span-2",
  ) => (
    <div
      className={`${colSpan} bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 flex flex-col justify-between`}
    >
      <div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-2xl!">
            dashboard_customize
          </span>
        </div>
        <h2 className="text-xl font-bold text-navy mb-1.5">
          Welcome to your Portal Workspace
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
          Your account is logged in as{" "}
          <strong>{user?.role_name || user?.role || "Staff Member"}</strong>.
          Use the shortcuts below to access your assigned management areas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {canReadContent && (
            <Link
              href="/portal/content"
              className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 transition-colors flex items-start gap-3"
            >
              <span className="material-symbols-outlined text-purple-600 text-2xl!">
                edit_note
              </span>
              <div>
                <h3 className="font-bold text-sm text-navy">Site Content</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Edit hero banners, why us, and legal documents.
                </p>
              </div>
            </Link>
          )}
          {canReadUsers && (
            <Link
              href="/portal/users"
              className="p-4 rounded-xl border border-teal-100 bg-teal-50/40 hover:bg-teal-50 transition-colors flex items-start gap-3"
            >
              <span className="material-symbols-outlined text-teal-600 text-2xl!">
                group
              </span>
              <div>
                <h3 className="font-bold text-sm text-navy">
                  Staff &amp; Users
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage user accounts and view staff permissions.
                </p>
              </div>
            </Link>
          )}
          {canReadCategories && (
            <Link
              href="/portal/categories"
              className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 transition-colors flex items-start gap-3"
            >
              <span className="material-symbols-outlined text-emerald-600 text-2xl!">
                category
              </span>
              <div>
                <h3 className="font-bold text-sm text-navy">
                  Categories &amp; Brands
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Browse medical categories and manufacturer brands.
                </p>
              </div>
            </Link>
          )}
          <Link
            href="/portal/profile"
            className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-gray-50 transition-colors flex items-start gap-3"
          >
            <span className="material-symbols-outlined text-gray-600 text-2xl!">
              account_circle
            </span>
            <div>
              <h3 className="font-bold text-sm text-navy">
                My Account Profile
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage your credentials, name, and security.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );

  // Dynamically assemble at most 3 prioritized quick-action links for the banner
  interface BannerAction {
    label: string;
    href: string;
    icon: string;
    priority: number;
  }

  const candidateActions: BannerAction[] = [];

  if (canReadProducts) {
    candidateActions.push({
      label: canWriteProducts ? "Manage Products" : "Browse Products",
      href: "/portal/products",
      icon: canWriteProducts ? "add_circle" : "inventory_2",
      priority: canWriteProducts ? 100 : 50,
    });
  }

  if (canReadQuotes) {
    const quoteCount = quoteStats ? quoteStats.total_quotes : liveQuotes.length;
    candidateActions.push({
      label: quoteCount > 0 ? `View Quotes (${quoteCount})` : "View Quotes",
      href: "/portal/quotes",
      icon: "receipt_long",
      priority: canWriteQuotes ? 90 : 60,
    });
  }

  if (canReadInquiries) {
    const inqCount = inquiriesStats?.total_new ?? 0;
    candidateActions.push({
      label: inqCount > 0 ? `Inquiries (${inqCount})` : "Inquiries & Leads",
      href: "/portal/inquiries",
      icon: "mail",
      priority: canWriteInquiries ? 85 : 40,
    });
  }

  if (canReadContent) {
    candidateActions.push({
      label: canWriteContent ? "Site Content" : "View Content",
      href: "/portal/content",
      icon: "edit_note",
      priority: canWriteContent ? 75 : 35,
    });
  }

  if (canReadCategories) {
    candidateActions.push({
      label: canWriteCategories ? "Categories & Brands" : "Browse Categories",
      href: "/portal/categories",
      icon: "category",
      priority: canWriteCategories ? 70 : 30,
    });
  }

  if (canReadUsers) {
    candidateActions.push({
      label: canWriteUsers ? "Manage Users" : "Staff Directory",
      href: "/portal/users",
      icon: "group",
      priority: canWriteUsers ? 65 : 25,
    });
  }

  // Sort candidate operational actions by priority descending
  candidateActions.sort((a, b) => b.priority - a.priority);

  // Guide link is always accessible to all users as a quick reference
  const guideAction: BannerAction = {
    label: isAdmin ? "Admin Guide" : "Portal Guide",
    href: "/portal/guide",
    icon: "menu_book",
    priority: 1,
  };

  // Limit banner to at most 3 relevant links:
  // 1. Top operational action (Primary, Gold button)
  // 2. Second operational action (or Guide if only 1 exists)
  // 3. Guide (or Profile if user has limited modules)
  const bannerActions: BannerAction[] = [];
  if (candidateActions.length >= 2) {
    bannerActions.push(candidateActions[0]);
    bannerActions.push(candidateActions[1]);
    bannerActions.push(guideAction);
  } else if (candidateActions.length === 1) {
    bannerActions.push(candidateActions[0]);
    bannerActions.push(guideAction);
    bannerActions.push({
      label: "My Profile",
      href: "/portal/profile",
      icon: "account_circle",
      priority: 0,
    });
  } else {
    bannerActions.push({
      label: "My Profile",
      href: "/portal/profile",
      icon: "account_circle",
      priority: 0,
    });
    bannerActions.push(guideAction);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-navy rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-gold/30">
              <span className="w-2 h-2 rounded-full bg-gold"></span>
              {isAdmin
                ? "Admin Control Centre"
                : `${user?.role_name || user?.role || "Staff"} Workspace`}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back to SA Healthcare {isAdmin ? "CMS" : "Portal"}
            </h1>
            <p className="text-gray-300 text-sm sm:text-base mt-1 max-w-xl font-light">
              {isAdmin
                ? "Manage medical products, handle clinical quote requests, update homepage banners and maintain partner manufacturers."
                : "Access your authorized healthcare operations, manage requests, and track workflow progress."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {bannerActions.map((action, index) => {
              const isPrimary = index === 0;
              return (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className={
                    isPrimary
                      ? "bg-gold text-navy font-bold px-4 py-2.5 rounded-xl hover:bg-gold-bright transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                      : "bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-xl border border-white/15 text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  }
                >
                  <span className="material-symbols-outlined text-lg!">
                    {action.icon}
                  </span>
                  <span>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Decorative corner shape */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Stats KPI Cards (only rendered if user has access to at least one stat metric) */}
      {statsCards.length > 0 && (
        <div className={statsGridClass}>
          {statsCards.map((stat) => (
            <Link
              key={stat.title}
              href={stat.link}
              className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
            >
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-navy transition-colors">
                  {stat.title}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-navy mt-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs! text-emerald-600">
                    trending_up
                  </span>
                  {stat.change}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0 group-hover:scale-105 transition-transform`}
              >
                <span className="material-symbols-outlined text-2xl!">
                  {stat.icon}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Main Grid: Modules & Management Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Primary Left Module (2 Cols) */}
        {canReadQuotes
          ? renderQuotesSection("lg:col-span-2")
          : canReadInquiries
            ? renderInquiriesSection("lg:col-span-2")
            : canReadProducts
              ? renderProductsSection("lg:col-span-2")
              : renderWorkspaceOverviewSection("lg:col-span-2")}

        {/* Secondary Right Column (1 Col) */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* If products are accessible and didn't take the primary left slot, render Live Products spotlight */}
          {canReadProducts &&
            (canReadQuotes || canReadInquiries) &&
            renderProductsWidget()}

          {/* Quick Management Shortcuts (filtered strictly by permission) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">apps</span>
              Management Portals
            </h3>
            <div className="space-y-2">
              {canReadQuotes && (
                <Link
                  href="/portal/quotes"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base! text-amber-500">
                      receipt_long
                    </span>
                    <span>Quote Requests &amp; RFQs</span>
                  </div>
                  <span className="material-symbols-outlined text-xs! text-gray-400">
                    chevron_right
                  </span>
                </Link>
              )}
              {canReadProducts && (
                <Link
                  href="/portal/products"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base! text-blue-600">
                      inventory_2
                    </span>
                    <span>Products Catalogue</span>
                  </div>
                  <span className="material-symbols-outlined text-xs! text-gray-400">
                    chevron_right
                  </span>
                </Link>
              )}
              {canReadCategories && (
                <Link
                  href="/portal/categories"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base! text-emerald-600">
                      category
                    </span>
                    <span>Categories &amp; Manufacturers</span>
                  </div>
                  <span className="material-symbols-outlined text-xs! text-gray-400">
                    chevron_right
                  </span>
                </Link>
              )}
              {canReadInquiries && (
                <Link
                  href="/portal/inquiries"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base! text-indigo-600">
                      mail
                    </span>
                    <span>Customer Inquiries &amp; Leads</span>
                  </div>
                  <span className="material-symbols-outlined text-xs! text-gray-400">
                    chevron_right
                  </span>
                </Link>
              )}
              {canReadContent && (
                <Link
                  href="/portal/content"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base! text-purple-600">
                      edit_note
                    </span>
                    <span>Edit Site Content &amp; Hero Banner</span>
                  </div>
                  <span className="material-symbols-outlined text-xs! text-gray-400">
                    chevron_right
                  </span>
                </Link>
              )}
              {canReadUsers && (
                <Link
                  href="/portal/users"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base! text-teal-600">
                      group
                    </span>
                    <span>User Accounts &amp; Permissions</span>
                  </div>
                  <span className="material-symbols-outlined text-xs! text-gray-400">
                    chevron_right
                  </span>
                </Link>
              )}
              <Link
                href="/portal/profile"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base! text-gray-500">
                    account_circle
                  </span>
                  <span>My Account Profile</span>
                </div>
                <span className="material-symbols-outlined text-xs! text-gray-400">
                  chevron_right
                </span>
              </Link>
              <Link
                href="/portal/guide"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base! text-gray-500">
                    menu_book
                  </span>
                  <span>Portal Documentation Guide</span>
                </div>
                <span className="material-symbols-outlined text-xs! text-gray-400">
                  chevron_right
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Inquiries & Leads table when user has access to BOTH Quotes AND Inquiries */}
      {canReadQuotes && canReadInquiries && (
        <div className="w-full">{renderInquiriesSection("w-full")}</div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-100 bg-navy text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-fadeIn">
          <span className="material-symbols-outlined text-gold text-xl!">
            info
          </span>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">
            {toastMessage}
          </span>
        </div>
      )}

      {/* Quote Details Modal (Only rendered if quotes permission is granted) */}
      {canReadQuotes && (
        <QuoteDetailsModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
          onQuoteUpdated={handleQuoteUpdated}
          onToast={showToast}
        />
      )}
    </div>
  );
}
