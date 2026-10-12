"use client";

import { useState } from 'react';

interface QuoteItemLine {
  productId: string;
  name: string;
  brand: string;
  quantity: number;
}

interface QuoteRequest {
  id: string;
  facility: string;
  contactName: string;
  email: string;
  phone: string;
  sector: string;
  date: string;
  urgency: 'Standard' | 'Urgent' | 'Procurement Tender';
  status: 'New' | 'In Review' | 'Quoted' | 'Approved' | 'Declined';
  notes?: string;
  items: QuoteItemLine[];
}

const INITIAL_QUOTES: QuoteRequest[] = [
  {
    id: 'QR-2041',
    facility: 'Mediclinic Panorama',
    contactName: 'Dr. Johan van der Merwe',
    email: 'johan.vandermerwe@mediclinic.co.za',
    phone: '+27 21 938 2111',
    sector: 'Hospitals & Healthcare Groups',
    date: '12 Oct 2026, 09:45 AM',
    urgency: 'Urgent',
    status: 'New',
    notes: 'ICU ward upgrade scheduled for next month. Require 4 multi-parameter monitors with wall mount accessories.',
    items: [
      { productId: '1', name: 'BeneVision N12', brand: 'Mindray', quantity: 4 },
      { productId: '2', name: 'IntelliVue MX450', brand: 'Philips', quantity: 2 },
    ],
  },
  {
    id: 'QR-2040',
    facility: 'Netcare St Augustine\'s Hospital',
    contactName: 'Sister Nomsa Dlamini',
    email: 'nomsa.dlamini@netcare.co.za',
    phone: '+27 31 268 5000',
    sector: 'Hospitals & Healthcare Groups',
    date: '11 Oct 2026, 16:20 PM',
    urgency: 'Standard',
    status: 'In Review',
    notes: 'Need telemetry capabilities compatible with existing Wi-Fi infrastructure.',
    items: [
      { productId: '3', name: 'Infinity M300', brand: 'Dräger', quantity: 6 },
    ],
  },
  {
    id: 'QR-2039',
    facility: 'Life Westville Hospital',
    contactName: 'Kevin Pillay',
    email: 'kevin.pillay@lifehealthcare.co.za',
    phone: '+27 31 251 6000',
    sector: 'Clinics & Primary Care',
    date: '10 Oct 2026, 11:15 AM',
    urgency: 'Procurement Tender',
    status: 'Quoted',
    notes: 'Quote sent by Senior Representative S. Naidoo on 10 Oct.',
    items: [
      { productId: '4', name: 'CMS8000', brand: 'Contec', quantity: 10 },
      { productId: '1', name: 'BeneVision N12', brand: 'Mindray', quantity: 2 },
    ],
  },
  {
    id: 'QR-2038',
    facility: 'Cape Town Day Clinic',
    contactName: 'Dr. Sarah Adams',
    email: 'admin@ctdayclinic.co.za',
    phone: '+27 21 422 1000',
    sector: 'Clinics & Primary Care',
    date: '08 Oct 2026, 14:00 PM',
    urgency: 'Standard',
    status: 'Approved',
    notes: 'Purchase order issued. Delivery coordinated for 20 October.',
    items: [
      { productId: '1', name: 'BeneVision N12', brand: 'Mindray', quantity: 1 },
    ],
  },
];

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>(INITIAL_QUOTES);
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'In Review' | 'Quoted' | 'Closed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.facility.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'All') return true;
    if (activeTab === 'New') return q.status === 'New';
    if (activeTab === 'In Review') return q.status === 'In Review';
    if (activeTab === 'Quoted') return q.status === 'Quoted';
    if (activeTab === 'Closed') return q.status === 'Approved' || q.status === 'Declined';
    return true;
  });

  const handleOpenDetails = (q: QuoteRequest) => {
    setSelectedQuote(q);
    setInternalNoteInput(q.notes || '');
  };

  const handleUpdateStatus = (id: string, newStatus: QuoteRequest['status']) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
    );
    if (selectedQuote && selectedQuote.id === id) {
      setSelectedQuote((prev) => prev ? { ...prev, status: newStatus } : null);
    }
    showToast(`Updated ${id} status to "${newStatus}"`);
  };

  const handleSaveNotes = () => {
    if (!selectedQuote) return;
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === selectedQuote.id ? { ...q, notes: internalNoteInput } : q
      )
    );
    setSelectedQuote((prev) => prev ? { ...prev, notes: internalNoteInput } : null);
    showToast(`Notes saved for ${selectedQuote.id}`);
  };

  const getStatusBadge = (status: QuoteRequest['status']) => {
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
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy text-white px-5 py-3 rounded-xl shadow-2xl border border-gold/40 flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-gold text-xl!">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
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
          <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            {quotes.filter((q) => q.status === 'New').length} pending response
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(['All', 'New', 'In Review', 'Quoted', 'Closed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-navy shadow-xs'
                  : 'text-gray-500 hover:text-navy'
              }`}
            >
              {tab}
              {tab === 'New' && (
                <span className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {quotes.filter((q) => q.status === 'New').length}
                </span>
              )}
            </button>
          ))}
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
            placeholder="Search by facility, contact, or ID..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-navy"
          />
        </div>

      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">ID &amp; Facility</th>
                <th className="px-4 py-3.5">Contact Person</th>
                <th className="px-4 py-3.5">Equipment Requested</th>
                <th className="px-4 py-3.5">Date Submitted</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-gray-300">
                      receipt_long
                    </span>
                    No quote requests found in this view.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* ID & Facility */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-navy text-sm">{q.facility}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <span className="text-blue-600 font-semibold">{q.id}</span>
                        <span>&bull;</span>
                        <span>{q.sector}</span>
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-800">{q.contactName}</div>
                      <div className="text-[11px] text-gray-500 truncate">{q.email}</div>
                    </td>

                    {/* Equipment Requested */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {q.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-gray-400">({item.brand})</span>
                            <span className="font-mono bg-slate-100 text-gray-600 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              &times;{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div>{q.date}</div>
                      {q.urgency === 'Urgent' && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.2 rounded-full uppercase">
                          Urgent
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusBadge(q.status)}`}>
                        {q.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetails(q)}
                        className="bg-navy text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-navy-light transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Review</span>
                        <span className="material-symbols-outlined text-xs!">visibility</span>
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Detail Drawer / Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 text-sm">{selectedQuote.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(selectedQuote.status)}`}>
                    {selectedQuote.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-navy mt-1">{selectedQuote.facility}</h2>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-gray-400 hover:text-navy p-1 rounded-lg"
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
                    <span className="text-gray-400 block">Contact Name</span>
                    <span className="font-bold text-navy text-sm">{selectedQuote.contactName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Healthcare Sector</span>
                    <span className="font-medium text-gray-700">{selectedQuote.sector}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Email Address</span>
                    <a href={`mailto:${selectedQuote.email}`} className="font-medium text-blue-600 hover:underline">
                      {selectedQuote.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Telephone Number</span>
                    <a href={`tel:${selectedQuote.phone}`} className="font-medium text-blue-600 hover:underline">
                      {selectedQuote.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Requested Medical Equipment ({selectedQuote.items.length})
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {selectedQuote.items.map((item, i) => (
                    <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-navy text-sm">{item.name}</div>
                        <div className="text-gray-400 uppercase text-[11px] font-semibold">{item.brand}</div>
                      </div>
                      <div className="text-right">
                        <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-xs border border-blue-200">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal / Customer Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Inquiry Notes &amp; Specification Requirements
                </label>
                <textarea
                  rows={3}
                  value={internalNoteInput}
                  onChange={(e) => setInternalNoteInput(e.target.value)}
                  placeholder="Record quotation pricing, supplier lead times, or customer questions..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm!">save</span>
                  Save Notes
                </button>
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
                href={`mailto:${selectedQuote.email}?subject=Quotation%20Reference%20${selectedQuote.id}%20-%20SA%20Healthcare`}
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

    </div>
  );
}
