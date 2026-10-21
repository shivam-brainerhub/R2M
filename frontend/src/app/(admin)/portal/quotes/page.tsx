"use client";

import QuoteDetailsModal, {
  getStatusBadge,
  getUrgencyBadge,
} from "@/components/admin/QuoteDetailsModal";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  QuoteRequestData,
  quotesApi,
  QuoteStatsData,
} from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

type TabStatus =
  | "All"
  | "New"
  | "In Review"
  | "Quoted"
  | "Approved"
  | "Declined";

export default function AdminQuotesPage() {
  const { token, hasPermission } = useAuth();
  const canWriteQuotes = hasPermission("quotes", "write");

  const [quotes, setQuotes] = useState<QuoteRequestData[]>([]);
  const [stats, setStats] = useState<QuoteStatsData | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequestData | null>(
    null,
  );

  // Delete Confirmation State
  const [quoteToDelete, setQuoteToDelete] = useState<QuoteRequestData | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshData = useCallback(() => {
    if (!token) return;
    quotesApi
      .getQuoteStats(token)
      .then((data) => {
        setStats(data);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("admin:refresh-stats"));
        }
      })
      .catch(() => {});
    quotesApi
      .listQuotes(token, {
        status: activeTab !== "All" ? activeTab : undefined,
        search: searchQuery.trim() || undefined,
      })
      .then(setQuotes)
      .catch(() => {});
  }, [token, activeTab, searchQuery]);

  useEffect(() => {
    let active = true;
    if (!token) return;

    quotesApi
      .getQuoteStats(token)
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((e) => console.error("Failed to load stats", e));

    quotesApi
      .listQuotes(token, {
        status: activeTab !== "All" ? activeTab : undefined,
        search: searchQuery.trim() || undefined,
      })
      .then((data) => {
        if (active) {
          setQuotes(data);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.error("Failed to load quotes", e);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, activeTab, searchQuery]);

  const handleOpenDetails = (q: QuoteRequestData) => {
    setSelectedQuote(q);
  };

  const handleQuoteUpdated = (updated: QuoteRequestData) => {
    setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    setSelectedQuote(updated);
    refreshData();
  };

  const confirmDelete = async () => {
    if (!quoteToDelete || !token) return;
    setIsDeleting(true);
    try {
      await quotesApi.deleteQuote(token, quoteToDelete.id);
      setQuotes((prev) => prev.filter((q) => q.id !== quoteToDelete.id));
      if (selectedQuote?.id === quoteToDelete.id) {
        setSelectedQuote(null);
      }
      setQuoteToDelete(null);
      refreshData();
      showToast(`Deleted quote request ${quoteToDelete.quote_number}`);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to delete quote";
      showToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Quote Inquiries &amp; Requests
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review incoming quote requests submitted by hospital groups,
            clinics, and doctors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <strong>
              {stats?.new_quotes ??
                quotes.filter((q) => q.status === "New").length}
            </strong>{" "}
            pending review
          </span>
        </div>
      </div>

      {!canWriteQuotes && (
        <div className="bg-amber-50/90 border border-amber-200/90 text-amber-900 rounded-2xl p-4 flex items-center gap-3 text-xs leading-relaxed">
          <span className="material-symbols-outlined text-amber-600 text-xl! shrink-0">
            visibility
          </span>
          <div>
            <p className="font-bold text-amber-950">Read-Only Quotes View</p>
            <p className="text-amber-800/90 mt-0.5">
              Your account has read-only access to quotation requests. Modifying
              request status, updating quoted amounts, adding internal notes, or
              deleting requests is disabled.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          {(
            [
              "All",
              "New",
              "In Review",
              "Quoted",
              "Approved",
              "Declined",
            ] as const
          ).map((tab) => {
            const count =
              stats && tab !== "All"
                ? tab === "New"
                  ? stats.new_quotes
                  : tab === "In Review"
                    ? stats.in_review_quotes
                    : tab === "Quoted"
                      ? stats.quoted_quotes
                      : tab === "Approved"
                        ? stats.approved_quotes
                        : stats.declined_quotes
                : stats?.total_quotes;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab
                    ? "bg-white text-navy shadow-xs"
                    : "text-gray-500 hover:text-navy"
                }`}
              >
                <span>{tab}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      tab === "New"
                        ? "bg-amber-500 text-white"
                        : activeTab === tab
                          ? "bg-slate-100 text-navy"
                          : "bg-slate-200 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg!">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility, contact, or QR number..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-navy"
          />
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl animate-spin text-blue-600">
              progress_activity
            </span>
            <p className="text-xs text-gray-500 font-semibold">
              Loading quotation requests...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">ID &amp; Facility</th>
                  <th className="px-4 py-3.5">Contact Person</th>
                  <th className="px-4 py-3.5">Equipment Requested</th>
                  <th className="px-4 py-3.5">Date &amp; Urgency</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      <span className="material-symbols-outlined text-4xl block mb-2 text-gray-300">
                        receipt_long
                      </span>
                      No quote requests found in this view.
                    </td>
                  </tr>
                ) : (
                  quotes.map((q) => (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* ID & Facility */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-navy text-sm">
                          {q.facility_name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-blue-600 font-semibold">
                            {q.quote_number}
                          </span>
                          {q.sector && (
                            <>
                              <span>&bull;</span>
                              <span>{q.sector}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Contact Person */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-800">
                          {q.contact_name}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {q.email}
                        </div>
                      </td>

                      {/* Equipment Requested */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {q.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 text-xs text-gray-700"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              <span className="font-semibold">
                                {item.product_name}
                              </span>
                              {item.brand_name && (
                                <span className="text-gray-400">
                                  ({item.brand_name})
                                </span>
                              )}
                              <span className="font-mono bg-slate-100 text-gray-600 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                &times;{item.quantity}
                              </span>
                            </div>
                          ))}
                          {q.items.length > 3 && (
                            <div className="text-[10px] text-gray-400 font-semibold pl-3">
                              +{q.items.length - 3} more item(s)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date & Urgency */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                        <div>
                          {new Date(q.created_at).toLocaleDateString("en-ZA", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <span
                          className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border ${getUrgencyBadge(
                            q.urgency,
                          )}`}
                        >
                          {q.urgency}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusBadge(
                            q.status,
                          )}`}
                        >
                          {q.status}
                        </span>
                        {q.quoted_amount && (
                          <div className="text-[11px] font-bold text-emerald-700 mt-1">
                            {q.quoted_amount}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(q)}
                            className="bg-navy text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-navy-light transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Review</span>
                            <span className="material-symbols-outlined text-xs!">
                              visibility
                            </span>
                          </button>
                          {canWriteQuotes && (
                            <button
                              type="button"
                              onClick={() => setQuoteToDelete(q)}
                              className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                              title="Delete Quote"
                            >
                              <span className="material-symbols-outlined text-sm!">
                                delete
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quote Detail Drawer / Modal */}
      <QuoteDetailsModal
        quote={selectedQuote}
        onClose={() => setSelectedQuote(null)}
        onQuoteUpdated={handleQuoteUpdated}
        onToast={showToast}
      />

      {/* Delete Confirmation Modal */}
      {quoteToDelete && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl!">
                delete
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy">
                Delete Quote Request?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete quotation request{" "}
                <strong className="text-navy">
                  {quoteToDelete.quote_number}
                </strong>{" "}
                for <strong>{quoteToDelete.facility_name}</strong>? This action
                cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuoteToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
