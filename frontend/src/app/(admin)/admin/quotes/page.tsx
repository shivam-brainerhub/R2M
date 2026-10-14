"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  quotesApi,
  QuoteRequestData,
  QuoteStatsData,
  ApiError,
  getMediaUrl,
} from '@/lib/api';

type TabStatus = 'All' | 'New' | 'In Review' | 'Quoted' | 'Approved' | 'Declined';

export default function AdminQuotesPage() {
  const { token } = useAuth();

  const [quotes, setQuotes] = useState<QuoteRequestData[]>([]);
  const [stats, setStats] = useState<QuoteStatsData | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequestData | null>(null);
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [quotedAmountInput, setQuotedAmountInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation State
  const [quoteToDelete, setQuoteToDelete] = useState<QuoteRequestData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshData = useCallback(() => {
    if (!token) return;
    quotesApi.getQuoteStats(token).then(setStats).catch(() => {});
    quotesApi
      .listQuotes(token, {
        status: activeTab !== 'All' ? activeTab : undefined,
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
      .catch((e) => console.error('Failed to load stats', e));

    quotesApi
      .listQuotes(token, {
        status: activeTab !== 'All' ? activeTab : undefined,
        search: searchQuery.trim() || undefined,
      })
      .then((data) => {
        if (active) {
          setQuotes(data);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.error('Failed to load quotes', e);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, activeTab, searchQuery]);


  const handleOpenDetails = (q: QuoteRequestData) => {
    setSelectedQuote(q);
    setInternalNoteInput(q.internal_notes || '');
    setQuotedAmountInput(q.quoted_amount || '');
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    if (!token) return;
    try {
      const updated = await quotesApi.updateQuote(token, id, { status: newStatus });
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      if (selectedQuote && selectedQuote.id === id) {
        setSelectedQuote(updated);
      }
      refreshData();
      showToast(`Updated ${updated.quote_number} status to "${newStatus}"`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update quote status';
      showToast(msg);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedQuote || !token) return;
    setIsSaving(true);
    try {
      const updated = await quotesApi.updateQuote(token, selectedQuote.id, {
        internal_notes: internalNoteInput.trim() || null,
        quoted_amount: quotedAmountInput.trim() || null,
      });
      setQuotes((prev) => prev.map((q) => (q.id === selectedQuote.id ? updated : q)));
      setSelectedQuote(updated);
      showToast(`Saved details for ${selectedQuote.quote_number}`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save notes';
      showToast(msg);
    } finally {
      setIsSaving(false);
    }
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
      const msg = err instanceof ApiError ? err.message : 'Failed to delete quote';
      showToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Quoted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Declined':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'Procurement Tender':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-100 bg-navy text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-fadeIn">
          <span className="material-symbols-outlined text-gold text-xl!">info</span>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Quote Inquiries &amp; Requests
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review incoming quote requests submitted by hospital groups, clinics, and doctors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <strong>{stats?.new_quotes ?? quotes.filter((q) => q.status === 'New').length}</strong> pending review
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          {(['All', 'New', 'In Review', 'Quoted', 'Approved', 'Declined'] as const).map((tab) => {
            const count =
              stats && tab !== 'All'
                ? tab === 'New'
                  ? stats.new_quotes
                  : tab === 'In Review'
                  ? stats.in_review_quotes
                  : tab === 'Quoted'
                  ? stats.quoted_quotes
                  : tab === 'Approved'
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
                    ? 'bg-white text-navy shadow-xs'
                    : 'text-gray-500 hover:text-navy'
                }`}
              >
                <span>{tab}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      tab === 'New'
                        ? 'bg-amber-500 text-white'
                        : activeTab === tab
                        ? 'bg-slate-100 text-navy'
                        : 'bg-slate-200 text-gray-600'
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
            <p className="text-xs text-gray-500 font-semibold">Loading quotation requests...</p>
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
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <span className="material-symbols-outlined text-4xl block mb-2 text-gray-300">
                        receipt_long
                      </span>
                      No quote requests found in this view.
                    </td>
                  </tr>
                ) : (
                  quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID & Facility */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-navy text-sm">{q.facility_name}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-blue-600 font-semibold">{q.quote_number}</span>
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
                        <div className="font-medium text-gray-800">{q.contact_name}</div>
                        <div className="text-[11px] text-gray-500 truncate">{q.email}</div>
                      </td>

                      {/* Equipment Requested */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {q.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              <span className="font-semibold">{item.product_name}</span>
                              {item.brand_name && (
                                <span className="text-gray-400">({item.brand_name})</span>
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
                          {new Date(q.created_at).toLocaleDateString('en-ZA', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border ${getUrgencyBadge(q.urgency)}`}>
                          {q.urgency}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusBadge(q.status)}`}>
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
                            <span className="material-symbols-outlined text-xs!">visibility</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuoteToDelete(q)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                            title="Delete Quote"
                          >
                            <span className="material-symbols-outlined text-sm!">delete</span>
                          </button>
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
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8 overflow-hidden max-h-[90vh] flex flex-col animate-scaleIn">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 text-sm">
                    {selectedQuote.quote_number}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(selectedQuote.status)}`}>
                    {selectedQuote.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getUrgencyBadge(selectedQuote.urgency)}`}>
                    {selectedQuote.urgency}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-navy mt-1">{selectedQuote.facility_name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="text-gray-400 hover:text-navy p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl!">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-6">
              
              {/* Contact Information Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Requester Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Contact Person</span>
                    <span className="font-bold text-navy text-sm">{selectedQuote.contact_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Healthcare Sector</span>
                    <span className="font-medium text-gray-700">{selectedQuote.sector || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Email Address</span>
                    <a href={`mailto:${selectedQuote.email}`} className="font-medium text-blue-600 hover:underline">
                      {selectedQuote.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Telephone Number</span>
                    <a href={`tel:${selectedQuote.phone}`} className="font-medium text-blue-600 hover:underline">
                      {selectedQuote.phone}
                    </a>
                  </div>
                  {selectedQuote.city && (
                    <div>
                      <span className="text-gray-400 block text-[11px]">Location</span>
                      <span className="font-medium text-gray-700">{selectedQuote.city}</span>
                    </div>
                  )}
                  {selectedQuote.department && (
                    <div>
                      <span className="text-gray-400 block text-[11px]">Department / Ward</span>
                      <span className="font-medium text-gray-700">{selectedQuote.department}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Requested Medical Equipment ({selectedQuote.items.length})
                </h3>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {selectedQuote.items.map((item, i) => (
                    <div key={i} className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Equipment Image */}
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
                          <div className="font-bold text-navy text-sm truncate">{item.product_name}</div>
                          <div className="text-gray-400 uppercase text-[10px] font-semibold flex items-center gap-2 mt-0.5">
                            {item.brand_name && <span>Brand: {item.brand_name}</span>}
                            {item.product_sku && <span>SKU: {item.product_sku}</span>}
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

              {/* Client Requirements */}
              {selectedQuote.notes && (
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 text-xs text-gray-800">
                  <span className="font-bold block uppercase text-amber-900 text-[10px] tracking-wider mb-1">
                    Client Clinical Notes &amp; Specifications
                  </span>
                  <p className="leading-relaxed whitespace-pre-wrap">{selectedQuote.notes}</p>
                </div>
              )}

              {/* Internal Sales Notes & Quoted Value */}
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
                      value={quotedAmountInput}
                      onChange={(e) => setQuotedAmountInput(e.target.value)}
                      placeholder="e.g. R 145,000.00 incl. VAT"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Internal Representative Notes &amp; Lead Times
                    </label>
                    <textarea
                      rows={2}
                      value={internalNoteInput}
                      onChange={(e) => setInternalNoteInput(e.target.value)}
                      placeholder="Record supplier lead times, delivery coordination, warranty terms..."
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveDetails}
                    disabled={isSaving}
                    className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-navy-light transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm!">save</span>
                    <span>{isSaving ? 'Saving...' : 'Save Internal Record'}</span>
                  </button>
                </div>
              </div>

              {/* Update Status Bar */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Change Request Status
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['New', 'In Review', 'Quoted', 'Approved', 'Declined'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedQuote.id, s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedQuote.status === s
                          ? 'bg-navy text-white shadow-xs'
                          : 'bg-white text-gray-600 hover:bg-slate-200 border border-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <a
                href={`mailto:${selectedQuote.email}?subject=Quotation%20Reference%20${selectedQuote.quote_number}%20-%20SA%20Healthcare`}
                className="bg-gold text-navy font-bold px-4 py-2 rounded-xl text-xs hover:bg-gold-bright transition-all shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm!">mail</span>
                Compose Email Quote
              </a>
              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {quoteToDelete && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl!">delete</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy">Delete Quote Request?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete quotation request{' '}
                <strong className="text-navy">{quoteToDelete.quote_number}</strong> for{' '}
                <strong>{quoteToDelete.facility_name}</strong>? This action cannot be undone.
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
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
