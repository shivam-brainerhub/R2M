"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  inquiriesApi,
  ContactMessageItem,
  SupplierApplicationItem,
  InquiriesStatsResponse,
  ApiError,
} from '@/lib/api';
import CustomSelect from '@/components/CustomSelect';

type InquiryTab = 'contact' | 'supplier';

export default function AdminInquiriesPage() {
  const { token, hasPermission } = useAuth();
  const canWriteInquiries = hasPermission('inquiries', 'write');

  // Tab State
  const [activeTab, setActiveTab] = useState<InquiryTab>('contact');

  // Stats State
  const [stats, setStats] = useState<InquiriesStatsResponse | null>(null);

  // Contact Messages State
  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);
  const [contactStatusFilter, setContactStatusFilter] = useState<string>('All');
  const [contactSearch, setContactSearch] = useState<string>('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Supplier Applications State
  const [supplierApps, setSupplierApps] = useState<SupplierApplicationItem[]>([]);
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<string>('All');
  const [supplierSearch, setSupplierSearch] = useState<string>('');
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

  // Modals & Active Selections
  const [selectedContact, setSelectedContact] = useState<ContactMessageItem | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierApplicationItem | null>(null);
  const [notesInput, setNotesInput] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete Confirmation Modal
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    type: 'contact' | 'supplier';
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await inquiriesApi.getInquiriesStats(token);
      setStats(data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin:refresh-stats'));
      }
    } catch (err) {
      console.error('Failed to fetch inquiries stats:', err);
    }
  }, [token]);

  const fetchContactMessages = useCallback(async () => {
    if (!token) return;
    setIsLoadingContacts(true);
    try {
      const data = await inquiriesApi.listContactMessages(token, {
        status: contactStatusFilter,
        search: contactSearch,
      });
      setContactMessages(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load contact messages';
      showToast(msg, 'error');
    } finally {
      setIsLoadingContacts(false);
    }
  }, [token, contactStatusFilter, contactSearch]);

  const fetchSupplierApplications = useCallback(async () => {
    if (!token) return;
    setIsLoadingSuppliers(true);
    try {
      const data = await inquiriesApi.listSupplierApplications(token, {
        status: supplierStatusFilter,
        search: supplierSearch,
      });
      setSupplierApps(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load supplier applications';
      showToast(msg, 'error');
    } finally {
      setIsLoadingSuppliers(false);
    }
  }, [token, supplierStatusFilter, supplierSearch]);

  useEffect(() => {
    let active = true;
    if (!token) return;

    inquiriesApi.getInquiriesStats(token).then((data) => {
      if (active) setStats(data);
    }).catch((err) => console.error('Failed to fetch inquiries stats:', err));

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;
    if (!token) return;

    if (activeTab === 'contact') {
      inquiriesApi
        .listContactMessages(token, {
          status: contactStatusFilter,
          search: contactSearch,
        })
        .then((data) => {
          if (active) {
            setContactMessages(data);
            setIsLoadingContacts(false);
          }
        })
        .catch((err) => {
          if (active) {
            const msg = err instanceof ApiError ? err.message : 'Failed to load contact messages';
            showToast(msg, 'error');
            setIsLoadingContacts(false);
          }
        });
    } else {
      inquiriesApi
        .listSupplierApplications(token, {
          status: supplierStatusFilter,
          search: supplierSearch,
        })
        .then((data) => {
          if (active) {
            setSupplierApps(data);
            setIsLoadingSuppliers(false);
          }
        })
        .catch((err) => {
          if (active) {
            const msg = err instanceof ApiError ? err.message : 'Failed to load supplier applications';
            showToast(msg, 'error');
            setIsLoadingSuppliers(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [token, activeTab, contactStatusFilter, contactSearch, supplierStatusFilter, supplierSearch]);

  // Lock background screen scroll when any inquiry modal is open
  const isAnyInquiryModalOpen = Boolean(selectedContact || selectedSupplier || itemToDelete);

  useEffect(() => {
    if (isAnyInquiryModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAnyInquiryModalOpen]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleOpenContactModal = (item: ContactMessageItem) => {
    setSelectedContact(item);
    setNotesInput(item.notes || '');
  };

  const handleOpenSupplierModal = (item: SupplierApplicationItem) => {
    setSelectedSupplier(item);
    setNotesInput(item.notes || '');
  };

  const handleUpdateContactStatus = async (newStatus: string) => {
    if (!token || !selectedContact) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await inquiriesApi.updateContactMessage(token, selectedContact.id, {
        status: newStatus,
      });
      setSelectedContact(updated);
      setContactMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      fetchStats();
      showToast(`Status updated to "${newStatus}"`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update status';
      showToast(msg, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveContactNotes = async () => {
    if (!token || !selectedContact) return;
    setIsSavingNotes(true);
    try {
      const updated = await inquiriesApi.updateContactMessage(token, selectedContact.id, {
        notes: notesInput,
      });
      setSelectedContact(updated);
      setContactMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      showToast('Internal notes saved successfully');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save notes';
      showToast(msg, 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleUpdateSupplierStatus = async (newStatus: string) => {
    if (!token || !selectedSupplier) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await inquiriesApi.updateSupplierApplication(token, selectedSupplier.id, {
        status: newStatus,
      });
      setSelectedSupplier(updated);
      setSupplierApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      fetchStats();
      showToast(`Status updated to "${newStatus}"`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update status';
      showToast(msg, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveSupplierNotes = async () => {
    if (!token || !selectedSupplier) return;
    setIsSavingNotes(true);
    try {
      const updated = await inquiriesApi.updateSupplierApplication(token, selectedSupplier.id, {
        notes: notesInput,
      });
      setSelectedSupplier(updated);
      setSupplierApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showToast('Internal notes saved successfully');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save notes';
      showToast(msg, 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!token || !itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'contact') {
        await inquiriesApi.deleteContactMessage(token, itemToDelete.id);
        setContactMessages((prev) => prev.filter((m) => m.id !== itemToDelete.id));
        if (selectedContact?.id === itemToDelete.id) setSelectedContact(null);
        showToast('Contact message deleted');
      } else {
        await inquiriesApi.deleteSupplierApplication(token, itemToDelete.id);
        setSupplierApps((prev) => prev.filter((a) => a.id !== itemToDelete.id));
        if (selectedSupplier?.id === itemToDelete.id) setSelectedSupplier(null);
        showToast('Supplier application deleted');
      }
      setItemToDelete(null);
      fetchStats();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete item';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helper Formatters
  // ---------------------------------------------------------------------------

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In Progress':
      case 'Under Review':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Responded':
      case 'Approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Archived':
      case 'Declined':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2.5 transition-all animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Inquiries & Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage contact form messages and supplier onboarding applications
          </p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            if (activeTab === 'contact') fetchContactMessages();
            else fetchSupplierApplications();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span>Refresh</span>
        </button>
      </div>

      {!canWriteInquiries && (
        <div className="bg-amber-50/90 border border-amber-200/90 text-amber-900 rounded-2xl p-4 flex items-center gap-3 text-xs leading-relaxed">
          <span className="material-symbols-outlined text-amber-600 text-xl! shrink-0">visibility</span>
          <div>
            <p className="font-bold text-amber-950">Read-Only Inquiries View</p>
            <p className="text-amber-800/90 mt-0.5">
              Your account has read-only access to customer inquiries and supplier applications.
            </p>
          </div>
        </div>
      )}

      {/* Top Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">mark_email_unread</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">{stats?.total_new ?? '—'}</div>
            <div className="text-xs text-gray-500 font-medium">New Unread Leads</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">mail</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">{stats?.total_contact ?? '—'}</div>
            <div className="text-xs text-gray-500 font-medium">Contact Messages</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">store</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">{stats?.total_supplier ?? '—'}</div>
            <div className="text-xs text-gray-500 font-medium">Supplier Applications</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">pending_actions</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">
              {stats ? (stats.total_in_progress ?? ((stats.in_progress_contact ?? 0) + (stats.under_review_supplier ?? 0))) : '—'}
            </div>
            <div className="text-xs text-gray-500 font-medium">In Progress / In Review</div>
          </div>
        </div>

      </div>

      {/* Main Content Area: Tabs + Filters + Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Tab Selector */}
        <div className="border-b border-gray-200 px-4 pt-3 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'contact'
                ? 'border-navy text-navy'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            <span className="material-symbols-outlined text-lg">mail</span>
            <span>Contact Messages</span>
            {stats && stats.new_contact > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                {stats.new_contact}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('supplier')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'supplier'
                ? 'border-navy text-navy'
                : 'border-transparent text-gray-500 hover:text-navy'
            }`}
          >
            <span className="material-symbols-outlined text-lg">domain</span>
            <span>Supplier Applications</span>
            {stats && stats.new_supplier > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                {stats.new_supplier}
              </span>
            )}
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder={
                activeTab === 'contact'
                  ? 'Search by name, email, org...'
                  : 'Search company, contact, category...'
              }
              value={activeTab === 'contact' ? contactSearch : supplierSearch}
              onChange={(e) => {
                if (activeTab === 'contact') setContactSearch(e.target.value);
                else setSupplierSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (activeTab === 'contact') fetchContactMessages();
                  else fetchSupplierApplications();
                }
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-navy focus:ring-1 focus:ring-navy/20"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <label className="text-xs text-gray-500 font-medium">Status:</label>
            <CustomSelect
              value={activeTab === 'contact' ? contactStatusFilter : supplierStatusFilter}
              onChange={(val) => {
                if (activeTab === 'contact') {
                  setContactStatusFilter(val);
                } else {
                  setSupplierStatusFilter(val);
                }
              }}
              options={
                activeTab === 'contact'
                  ? [
                      { value: 'All', label: 'All Statuses' },
                      { value: 'New', label: 'New' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Responded', label: 'Responded' },
                      { value: 'Archived', label: 'Archived' },
                    ]
                  : [
                      { value: 'All', label: 'All Statuses' },
                      { value: 'New', label: 'New' },
                      { value: 'Under Review', label: 'Under Review' },
                      { value: 'Approved', label: 'Approved' },
                      { value: 'Declined', label: 'Declined' },
                    ]
              }
              size="sm"
              align="right"
              className="min-w-36"
            />
          </div>
        </div>

        {/* Tab 1: Contact Messages Table */}
        {activeTab === 'contact' && (
          <div className="overflow-x-auto">
            {isLoadingContacts ? (
              <div className="p-12 text-center text-sm text-gray-500">
                <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-2" />
                Loading contact inquiries...
              </div>
            ) : contactMessages.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">
                  inbox
                </span>
                No contact inquiries match your filters.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Sender</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Message Snippet</th>
                    <th className="py-3 px-4">Received</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contactMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-navy">
                          {msg.first_name} {msg.last_name}
                        </div>
                        {msg.organization && (
                          <div className="text-[11px] text-gray-500">{msg.organization}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`mailto:${msg.email}`}
                          className="text-navy hover:underline flex items-center gap-1 font-medium"
                        >
                          {msg.email}
                        </a>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-gray-600">
                        {msg.message}
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {formatDate(msg.created_at)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                            msg.status
                          )}`}
                        >
                          {msg.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenContactModal(msg)}
                            className="px-2.5 py-1 text-xs font-semibold text-navy bg-navy/5 hover:bg-navy/10 rounded-md transition-colors cursor-pointer"
                          >
                            View
                          </button>
                          {canWriteInquiries && (
                            <button
                              onClick={() =>
                                setItemToDelete({
                                  id: msg.id,
                                  type: 'contact',
                                  name: `${msg.first_name} ${msg.last_name}`,
                                })
                              }
                              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Supplier Applications Table */}
        {activeTab === 'supplier' && (
          <div className="overflow-x-auto">
            {isLoadingSuppliers ? (
              <div className="p-12 text-center text-sm text-gray-500">
                <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-2" />
                Loading supplier applications...
              </div>
            ) : supplierApps.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                <span className="material-symbols-outlined text-4xl text-gray-300 block mb-2">
                  domain_disabled
                </span>
                No supplier applications match your filters.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Company & Contact</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Overview</th>
                    <th className="py-3 px-4">Applied</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {supplierApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-navy">{app.company_name}</div>
                        <div className="text-[11px] text-gray-500">
                          {app.contact_person}
                          {app.job_title ? ` (${app.job_title})` : ''}
                        </div>
                        {app.website && (
                          <a
                            href={
                              app.website.startsWith('http')
                                ? app.website
                                : `https://${app.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            <span>Website</span>
                            <span className="material-symbols-outlined text-[10px]!">open_in_new</span>
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <a
                            href={`mailto:${app.email}`}
                            className="text-navy hover:underline font-medium"
                          >
                            {app.email}
                          </a>
                        </div>
                        <div className="text-[11px] text-gray-500">{app.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-medium text-[11px]">
                          {app.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-gray-600">
                        {app.overview}
                      </td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenSupplierModal(app)}
                            className="px-2.5 py-1 text-xs font-semibold text-navy bg-navy/5 hover:bg-navy/10 rounded-md transition-colors cursor-pointer"
                          >
                            View
                          </button>
                          {canWriteInquiries && (
                            <button
                              onClick={() =>
                                setItemToDelete({
                                  id: app.id,
                                  type: 'supplier',
                                  name: app.company_name,
                                })
                              }
                              className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Contact Message Details Modal */}
      {/* ------------------------------------------------------------------- */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Contact Message Details
                  </span>
                  {!canWriteInquiries && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                      Read-Only
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-navy">
                  {selectedContact.first_name} {selectedContact.last_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Email Address</span>
                <a
                  href={`mailto:${selectedContact.email}`}
                  className="font-semibold text-navy hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">mail</span>
                  <span>{selectedContact.email}</span>
                </a>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Organization</span>
                <div className="font-semibold text-navy">
                  {selectedContact.organization || 'Not specified'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Submission Date</span>
                <div className="font-semibold text-navy">{formatDate(selectedContact.created_at)}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Status</span>
                <CustomSelect
                  disabled={isUpdatingStatus || !canWriteInquiries}
                  value={selectedContact.status}
                  onChange={(val) => handleUpdateContactStatus(val)}
                  options={['New', 'In Progress', 'Responded', 'Archived']}
                  size="sm"
                  className="w-full mt-1"
                />
              </div>
            </div>

            {/* Message Body */}
            <div>
              <span className="text-xs font-semibold text-gray-700 block mb-1.5">
                Inquiry Message:
              </span>
              <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {selectedContact.message}
              </div>
            </div>

            {/* Internal Staff Notes */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-700 block">
                Internal Administrative Notes:
              </span>
              <textarea
                rows={3}
                readOnly={!canWriteInquiries}
                placeholder={
                  canWriteInquiries
                    ? "Add notes about call outcomes, assigned sales rep, follow-up dates..."
                    : "No internal administrative notes recorded."
                }
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className={`w-full p-3 text-xs border border-gray-200 rounded-lg outline-none ${
                  canWriteInquiries
                    ? "bg-white focus:border-navy focus:ring-1 focus:ring-navy/20"
                    : "bg-slate-50 text-gray-600 cursor-default"
                }`}
              />
              {canWriteInquiries && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveContactNotes}
                    disabled={isSavingNotes}
                    className="px-3 py-1.5 text-xs font-semibold bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <a
                href={`mailto:${selectedContact.email}?subject=RE: Inquiry to SA Healthcare`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold text-navy text-xs font-bold rounded-lg hover:bg-gold-bright transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">reply</span>
                <span>Reply by Email</span>
              </a>
              <button
                onClick={() => setSelectedContact(null)}
                className="px-4 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Supplier Application Details Modal */}
      {/* ------------------------------------------------------------------- */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Supplier Application Details
                  </span>
                  {!canWriteInquiries && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                      Read-Only
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-navy">{selectedSupplier.company_name}</h3>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Contact Person</span>
                <div className="font-semibold text-navy">
                  {selectedSupplier.contact_person}
                  {selectedSupplier.job_title ? ` (${selectedSupplier.job_title})` : ''}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Email & Phone</span>
                <a
                  href={`mailto:${selectedSupplier.email}`}
                  className="font-semibold text-navy hover:underline block truncate"
                >
                  {selectedSupplier.email}
                </a>
                <div className="text-gray-600 mt-0.5">{selectedSupplier.phone}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Company Website</span>
                {selectedSupplier.website ? (
                  <a
                    href={
                      selectedSupplier.website.startsWith('http')
                        ? selectedSupplier.website
                        : `https://${selectedSupplier.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span className="truncate">{selectedSupplier.website}</span>
                    <span className="material-symbols-outlined text-xs!">open_in_new</span>
                  </a>
                ) : (
                  <span className="text-gray-400 font-medium">None provided</span>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Category</span>
                <div className="font-semibold text-navy">{selectedSupplier.category}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Applied Date</span>
                <div className="font-semibold text-navy">
                  {formatDate(selectedSupplier.created_at)}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-medium block mb-1">Status</span>
                <CustomSelect
                  disabled={isUpdatingStatus || !canWriteInquiries}
                  value={selectedSupplier.status}
                  onChange={(val) => handleUpdateSupplierStatus(val)}
                  options={['New', 'Under Review', 'Approved', 'Declined']}
                  size="sm"
                  className="w-full mt-1"
                />
              </div>
            </div>

            {/* Overview Body */}
            <div>
              <span className="text-xs font-semibold text-gray-700 block mb-1.5">
                Company & Products Overview:
              </span>
              <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {selectedSupplier.overview}
              </div>
            </div>

            {/* Internal Staff Notes */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-700 block">
                Internal Administrative Notes:
              </span>
              <textarea
                rows={3}
                readOnly={!canWriteInquiries}
                placeholder={
                  canWriteInquiries
                    ? "Add notes about catalogue review, ISO certifications, pricing review..."
                    : "No internal administrative notes recorded."
                }
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className={`w-full p-3 text-xs border border-gray-200 rounded-lg outline-none ${
                  canWriteInquiries
                    ? "bg-white focus:border-navy focus:ring-1 focus:ring-navy/20"
                    : "bg-slate-50 text-gray-600 cursor-default"
                }`}
              />
              {canWriteInquiries && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveSupplierNotes}
                    disabled={isSavingNotes}
                    className="px-3 py-1.5 text-xs font-semibold bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <a
                href={`mailto:${selectedSupplier.email}?subject=RE: Supplier Partnership with SA Healthcare`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold text-navy text-xs font-bold rounded-lg hover:bg-gold-bright transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">reply</span>
                <span>Reply by Email</span>
              </a>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="px-4 py-1.5 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Delete Confirmation Modal */}
      {/* ------------------------------------------------------------------- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy">Confirm Deletion</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete the {itemToDelete.type === 'contact' ? 'contact message from' : 'supplier application from'}{' '}
                <span className="font-semibold text-navy">{itemToDelete.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
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
