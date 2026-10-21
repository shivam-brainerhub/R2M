"use client";

import { useAuth } from "@/context/AuthContext";
import { ApiError, getMediaUrl, QuoteRequestData, quotesApi } from "@/lib/api";
import Image from "next/image";
import { useEffect, useState } from "react";

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "New":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "In Review":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Quoted":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Declined":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export const getUrgencyBadge = (urgency: string) => {
  switch (urgency) {
    case "Urgent":
      return "bg-red-50 text-red-700 border-red-200 font-bold";
    case "Procurement Tender":
      return "bg-purple-50 text-purple-700 border-purple-200 font-bold";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
};

interface QuoteDetailsModalProps {
  quote: QuoteRequestData | null;
  onClose: () => void;
  onQuoteUpdated?: (updated: QuoteRequestData) => void;
  onToast?: (message: string) => void;
}

export default function QuoteDetailsModal({
  quote,
  onClose,
  onQuoteUpdated,
  onToast,
}: QuoteDetailsModalProps) {
  const { token, hasPermission } = useAuth();
  const canWriteQuotes = hasPermission("quotes", "write");
  const [localQuote, setLocalQuote] = useState<QuoteRequestData | null>(quote);
  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [quotedAmountInput, setQuotedAmountInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setLocalQuote(quote);
    if (quote) {
      setInternalNoteInput(quote.internal_notes || "");
      setQuotedAmountInput(quote.quoted_amount || "");
    }
  }, [quote]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!quote) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quote, onClose]);

  // Lock background screen scroll when modal is open
  useEffect(() => {
    if (!quote) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [quote]);

  if (!quote || !localQuote) return null;

  const handleUpdateStatus = async (newStatus: string) => {
    if (!token) {
      onToast?.("You must be logged in as an administrator to update quotes.");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      const updated = await quotesApi.updateQuote(token, localQuote.id, {
        status: newStatus,
      });
      setLocalQuote(updated);
      onQuoteUpdated?.(updated);
      onToast?.(`Updated ${updated.quote_number} status to "${newStatus}"`);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to update quote status";
      onToast?.(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!token) {
      onToast?.("You must be logged in as an administrator to save details.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await quotesApi.updateQuote(token, localQuote.id, {
        internal_notes: internalNoteInput.trim() || null,
        quoted_amount: quotedAmountInput.trim() || null,
      });
      setLocalQuote(updated);
      onQuoteUpdated?.(updated);
      onToast?.(`Saved details for ${localQuote.quote_number}`);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to save notes";
      onToast?.(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8 overflow-hidden max-h-[90vh] flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-600 text-sm">
                {localQuote.quote_number}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(
                  localQuote.status,
                )}`}
              >
                {localQuote.status}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] border ${getUrgencyBadge(
                  localQuote.urgency,
                )}`}
              >
                {localQuote.urgency}
              </span>
            </div>
            <h2 className="text-xl font-bold text-navy mt-1">
              {localQuote.facility_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-navy p-1 rounded-lg cursor-pointer transition-colors"
            aria-label="Close quote details modal"
          >
            <span className="material-symbols-outlined text-xl!">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain py-4 space-y-6">
          {/* Requester Details */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Requester Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[11px]">
                  Contact Person
                </span>
                <span className="font-bold text-navy text-sm">
                  {localQuote.contact_name}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">
                  Healthcare Sector
                </span>
                <span className="font-medium text-gray-700">
                  {localQuote.sector || "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">
                  Email Address
                </span>
                <a
                  href={`mailto:${localQuote.email}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {localQuote.email}
                </a>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">
                  Telephone Number
                </span>
                <a
                  href={`tel:${localQuote.phone}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {localQuote.phone}
                </a>
              </div>
              {localQuote.city && (
                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Location
                  </span>
                  <span className="font-medium text-gray-700">
                    {localQuote.city}
                  </span>
                </div>
              )}
              {localQuote.department && (
                <div>
                  <span className="text-gray-400 block text-[11px]">
                    Department / Ward
                  </span>
                  <span className="font-medium text-gray-700">
                    {localQuote.department}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Requested Equipment List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Requested Medical Equipment ({localQuote.items.length})
            </h3>
            <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {localQuote.items.map((item, i) => (
                <div
                  key={i}
                  className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl relative overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                      {item.image_url ? (
                        <Image
                          src={getMediaUrl(item.image_url)}
                          alt={item.product_name}
                          fill
                          sizes="56px"
                          className="object-contain p-0.5"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-2xl! text-gray-300">
                          inventory_2
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-navy text-sm truncate">
                        {item.product_name}
                      </div>
                      <div className="text-gray-400 uppercase text-[10px] font-semibold flex items-center gap-2 mt-0.5">
                        {item.brand_name && (
                          <span>Brand: {item.brand_name}</span>
                        )}
                        {item.product_sku && (
                          <span>SKU: {item.product_sku}</span>
                        )}
                      </div>
                      {item.item_notes && (
                        <div className="text-[11px] text-blue-600 italic mt-1 bg-blue-50/60 p-1.5 rounded-lg border border-blue-100 inline-block">
                          Item Note: &quot;{item.item_notes}&quot;
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-xs border border-blue-200">
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Clinical Notes */}
          {localQuote.notes && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-xs text-gray-800">
              <span className="font-bold block uppercase text-amber-900 text-[10px] tracking-wider mb-1">
                Client Clinical Notes &amp; Specifications
              </span>
              <p className="leading-relaxed whitespace-pre-wrap">
                {localQuote.notes}
              </p>
            </div>
          )}

          {/* Internal Quotation Record */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-gray-200/80">
            <h4 className="text-xs font-bold text-navy uppercase tracking-wider">
              Internal Quotation Record
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Quoted Total Amount (e.g. R 145,000.00)
                </label>
                <input
                  type="text"
                  readOnly={!canWriteQuotes}
                  value={quotedAmountInput}
                  onChange={(e) => setQuotedAmountInput(e.target.value)}
                  placeholder="e.g. R 145,000.00 incl. VAT"
                  className={`w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none font-bold text-navy ${
                    canWriteQuotes
                      ? "bg-white focus:border-blue-500"
                      : "bg-gray-100 cursor-not-allowed text-gray-600"
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Internal Representative Notes &amp; Lead Times
                </label>
                <textarea
                  rows={2}
                  readOnly={!canWriteQuotes}
                  value={internalNoteInput}
                  onChange={(e) => setInternalNoteInput(e.target.value)}
                  placeholder="Record supplier lead times, delivery coordination, warranty terms..."
                  className={`w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none text-navy ${
                    canWriteQuotes
                      ? "bg-white focus:border-blue-500"
                      : "bg-gray-100 cursor-not-allowed text-gray-600"
                  }`}
                />
              </div>
            </div>

            {canWriteQuotes && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-navy-light transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm!">
                    save
                  </span>
                  <span>{isSaving ? "Saving..." : "Save Internal Record"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Update Status Bar */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Request Status
            </span>
            {canWriteQuotes ? (
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "New",
                    "In Review",
                    "Quoted",
                    "Approved",
                    "Declined",
                  ] as const
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      localQuote.status === s
                        ? "bg-navy text-white shadow-xs"
                        : "bg-white text-gray-600 hover:bg-slate-200 border border-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusBadge(
                    localQuote.status,
                  )}`}
                >
                  {localQuote.status}
                </span>
                <span className="text-xs text-gray-400 italic">
                  (Read-only: write permission required to modify status)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <a
            href={`mailto:${localQuote.email}?subject=Quotation%20Reference%20${localQuote.quote_number}%20-%20SA%20Healthcare`}
            className="bg-gold text-navy font-bold px-4 py-2 rounded-xl text-xs hover:bg-gold-bright transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm!">mail</span>
            Compose Email Quote
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
