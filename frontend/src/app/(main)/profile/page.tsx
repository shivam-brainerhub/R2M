"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useQuoteCart } from '@/context/QuoteCartContext';
import { quotesApi, QuoteRequestData, getMediaUrl, ApiError } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const { itemCount, isLoaded } = useQuoteCart();

  const [myQuotes, setMyQuotes] = useState<QuoteRequestData[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequestData | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editOrganization, setEditOrganization] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    if (!editEmail.trim()) {
      setProfileErrorMsg('Email address cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        full_name: editFullName.trim() || null,
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim() || null,
        organization: editOrganization.trim() || null,
      });
      setProfileSuccessMsg('Profile updated successfully!');
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setProfileErrorMsg(err.message);
      } else if (err instanceof Error) {
        setProfileErrorMsg(err.message);
      } else {
        setProfileErrorMsg('Failed to update profile. Please try again.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/profile');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    let active = true;
    if (!token) return;
    
    quotesApi
      .getMyQuotes(token)
      .then((data) => {
        if (active) {
          setMyQuotes(data);
          setLoadingQuotes(false);
        }
      })
      .catch(() => {
        if (active) setLoadingQuotes(false);
      });

    return () => {
      active = false;
    };
  }, [token]);


  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading profile details...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const initials = user.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (user.username || 'AD').substring(0, 2).toUpperCase();

  const isAdmin = user.role === 'admin';

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

  return (
    <div className="min-h-[80vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Link href="/home" className="hover:text-navy transition-colors">Home</Link>
          <span>/</span>
          <span className="text-navy font-semibold">Account Profile</span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-navy rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-white/10">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gold text-navy font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
              {initials}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {user.full_name || user.username}
                </h1>
              </div>
              <p className="text-gray-300 text-sm font-light">
                {user.email || 'No email registered'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-gray-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Active Account
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-gold">badge</span>
                  Username: @{user.username}
                </span>
                {user.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-gold">phone</span>
                    {user.phone}
                  </span>
                )}
              </div>
            </div>

            {isAdmin && (
              <Link
                href="/admin"
                className="bg-gold hover:bg-gold-bright text-navy font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shrink-0 hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                Admin Portal
              </Link>
            )}
          </div>

          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-600/20 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Account Details & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Details (2 cols) */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-navy flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">person</span>
                Personal Information
              </h2>

              {!isEditingProfile && (
                <button
                  type="button"
                  onClick={() => {
                    setEditFullName(user.full_name || '');
                    setEditEmail(user.email || '');
                    setEditPhone(user.phone || '');
                    setEditOrganization(user.organization || '');
                    setProfileErrorMsg(null);
                    setProfileSuccessMsg(null);
                    setIsEditingProfile(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-navy bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm!">edit</span>
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {/* Notification Banners */}
            {profileSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
                <span className="material-symbols-outlined text-base! mt-0.5 shrink-0 text-emerald-600">check_circle</span>
                <span className="flex-1 leading-relaxed">{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
                <span className="material-symbols-outlined text-base! mt-0.5 shrink-0">error</span>
                <span className="flex-1 leading-relaxed">{profileErrorMsg}</span>
              </div>
            )}

            {!isEditingProfile ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Full Name</div>
                  <div className="font-semibold text-navy mt-1">{user.full_name || 'Not provided'}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Username</div>
                  <div className="font-semibold text-navy mt-1">@{user.username}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email Address</div>
                  <div className="font-semibold text-navy mt-1">{user.email || 'Not provided'}</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Telephone / Mobile</div>
                  <div className="font-semibold text-navy mt-1">
                    {user.phone ? (
                      <span>{user.phone}</span>
                    ) : (
                      <span className="text-gray-400 font-normal italic">Not provided</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl sm:col-span-2">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Organisation / Facility</div>
                  <div className="font-semibold text-navy mt-1">
                    {user.organization ? (
                      <span>{user.organization}</span>
                    ) : (
                      <span className="text-gray-400 font-normal italic">Not provided</span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl sm:col-span-2">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Account Status</div>
                  <div className="font-semibold text-emerald-600 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Verified &amp; Active
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="e.g. Dr. Johan van der Merwe"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Username (Immutable) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Username (Immutable)
                    </label>
                    <input
                      type="text"
                      value={`@${user.username}`}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 bg-slate-100 cursor-not-allowed"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. procurement@hospital.co.za"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Telephone / Mobile
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. +27 21 938 2111"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Auto-fills your telephone when requesting quotes.
                    </span>
                  </div>

                  {/* Organization */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Organisation / Facility
                    </label>
                    <input
                      type="text"
                      value={editOrganization}
                      onChange={(e) => setEditOrganization(e.target.value)}
                      placeholder="e.g. Groote Schuur Hospital / Mediclinic Panorama"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-500 outline-none text-navy bg-slate-50 focus:bg-white transition-all"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Auto-fills your facility details on official RFQs.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={savingProfile}
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileErrorMsg(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-navy bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 text-xs font-bold bg-gold hover:bg-gold-bright text-navy rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 hover:scale-102 active:scale-98"
                  >
                    {savingProfile ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm!">progress_activity</span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm!">save</span>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Actions & Logout (1 col) */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-base font-bold text-navy flex items-center gap-2 border-b border-gray-100 pb-4 mb-4">
                <span className="material-symbols-outlined text-gold">bolt</span>
                Quick Access
              </h2>

              <div className="space-y-2.5">
                <Link
                  href="/quote"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-gold text-lg">shopping_cart</span>
                    <span>Quote Cart</span>
                  </div>
                  {isLoaded && itemCount > 0 ? (
                    <span className="bg-gold text-navy text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {itemCount}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-[10px]">Empty</span>
                  )}
                </Link>

                <Link
                  href="/products"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-blue-600 text-lg">inventory_2</span>
                    <span>Browse Catalogue</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin/quotes"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors border border-gray-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 text-lg">receipt_long</span>
                      <span>Manage Quotes</span>
                    </div>
                    <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Logout Zone */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all border border-red-200 hover:border-red-300 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

        </div>

        {/* MY QUOTATION REQUESTS SECTION */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <span className="material-symbols-outlined text-gold">receipt_long</span>
                My Quotation Requests
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Track status, review requested medical equipment and access formal quotations.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-slate-100 px-3 py-1 rounded-xl">
              {myQuotes.length} Total
            </span>
          </div>

          {loadingQuotes ? (
            <div className="text-center py-10 space-y-2">
              <span className="material-symbols-outlined text-3xl animate-spin text-blue-600">progress_activity</span>
              <p className="text-xs text-gray-500">Loading your quote history...</p>
            </div>
          ) : myQuotes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl space-y-3">
              <span className="material-symbols-outlined text-4xl text-gray-300">receipt</span>
              <h3 className="text-sm font-bold text-navy">No quote requests yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Add equipment to your quote cart to submit your first clinical quotation request.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline pt-1"
              >
                <span>Browse Products</span>
                <span className="material-symbols-outlined text-xs!">arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-2xl overflow-hidden">
              {myQuotes.map((q) => (
                <div key={q.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-blue-600 text-xs sm:text-sm">
                        {q.quote_number}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(q.status)}`}>
                        {q.status}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(q.created_at).toLocaleDateString('en-ZA', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-navy">{q.facility_name}</div>
                    
                    <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                      <span>{q.items.length} Product{q.items.length > 1 ? 's' : ''}</span>
                      <span>&bull;</span>
                      <span>Total Units: {q.items.reduce((s, it) => s + it.quantity, 0)}</span>
                      {q.quoted_amount && (
                        <>
                          <span>&bull;</span>
                          <span className="font-bold text-emerald-700">Quoted Value: {q.quoted_amount}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setSelectedQuote(q)}
                      className="bg-navy text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-navy-light transition-all shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <span className="material-symbols-outlined text-xs!">visibility</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quote Detail Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="font-mono font-bold text-blue-600 text-xs">{selectedQuote.quote_number}</span>
                <h3 className="text-lg font-bold text-navy">{selectedQuote.facility_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="text-gray-400 hover:text-navy p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <span className="material-symbols-outlined text-xl!">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-5">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl text-xs">
                <span className="text-gray-500 font-medium">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold border uppercase text-[10px] ${getStatusBadge(selectedQuote.status)}`}>
                  {selectedQuote.status}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Equipment List ({selectedQuote.items.length})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {selectedQuote.items.map((it) => (
                    <div key={it.id} className="p-3 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl relative overflow-hidden shrink-0 flex items-center justify-center p-1">
                          {it.image_url ? (
                            <Image
                              src={getMediaUrl(it.image_url)}
                              alt={it.product_name}
                              fill
                              sizes="48px"
                              className="object-contain p-0.5"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-xl! text-gray-300">
                              inventory_2
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-navy truncate">{it.product_name}</div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            {it.brand_name && <span>{it.brand_name}</span>}
                            {it.product_sku && <span>SKU: {it.product_sku}</span>}
                          </div>
                          {it.item_notes && (
                            <div className="text-[11px] text-blue-600 mt-0.5 italic">
                              &bull; Note: &quot;{it.item_notes}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-xs text-navy shrink-0 ml-2">
                        Qty: {it.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuote.quoted_amount && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                  <span className="font-bold block">Quoted Price:</span>
                  <span className="text-base font-extrabold text-emerald-700">{selectedQuote.quoted_amount}</span>
                </div>
              )}

              {selectedQuote.notes && (
                <div className="text-xs text-gray-600 bg-slate-50 p-3 rounded-xl">
                  <span className="font-bold block text-navy mb-1">Your Requirements:</span>
                  {selectedQuote.notes}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="bg-navy text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-navy-light transition-all shadow-xs cursor-pointer hover:scale-102 active:scale-98"
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
