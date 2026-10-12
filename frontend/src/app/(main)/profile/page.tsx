"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useQuoteCart } from '@/context/QuoteCartContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { itemCount } = useQuoteCart();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/profile');
    }
  }, [isLoading, isAuthenticated, router]);

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

  return (
    <div className="min-h-[80vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Link href="/home" className="hover:text-navy transition-colors">Home</Link>
          <span>/</span>
          <span className="text-navy font-semibold">Account Profile</span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-navy rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-white/10">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gold text-navy font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
              {initials}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {user.full_name || user.username}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                  isAdmin ? 'bg-gold text-navy' : 'bg-white/15 text-white'
                }`}>
                  {user.role || 'User'}
                </span>
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
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-base font-bold text-navy flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">person</span>
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Full Name</div>
                <div className="font-semibold text-navy mt-1">{user.full_name || 'Not provided'}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Username</div>
                <div className="font-semibold text-navy mt-1">@{user.username}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl sm:col-span-2">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email Address</div>
                <div className="font-semibold text-navy mt-1">{user.email || 'Not provided'}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">System Role</div>
                <div className="font-semibold text-navy mt-1 capitalize">{user.role || 'Standard User'}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</div>
                <div className="font-semibold text-emerald-600 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Verified &amp; Active
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Logout (1 col) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 flex flex-col justify-between space-y-6">
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
                  {itemCount > 0 ? (
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
                    href="/admin/products"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors border border-gray-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 text-lg">dashboard</span>
                      <span>Admin Management</span>
                    </div>
                    <span className="material-symbols-outlined text-sm text-gray-400">chevron_right</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Account Danger / Logout Zone */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all border border-red-200 hover:border-red-300"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
