"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { getUserInitials } from '@/lib/utils';

export default function PortalProfilePage() {
  const { user, updateProfile, changePassword, isAdmin, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setOrganization(user.organization || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!email.trim()) {
      setProfileMessage({ type: 'error', text: 'Email address cannot be empty.' });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        full_name: fullName.trim() || undefined,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        organization: organization.trim() || undefined,
      });
      await refreshUser();
      setProfileMessage({ type: 'success', text: 'Profile details saved successfully.' });
      setTimeout(() => setProfileMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to update profile';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to change password';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  const initials = getUserInitials(user.full_name, user.username);
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Profile Banner */}
      <div className="relative bg-gradient-to-r from-navy via-navy to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-white/10">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-gold to-amber-300 text-navy flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shrink-0 uppercase tracking-wider">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {user.full_name || user.username}
                </h1>
                <span className="text-xs bg-gold/20 text-gold border border-gold/40 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {user.role_name || (isAdmin ? 'Administrator' : 'Staff')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 mt-1">
                @{user.username} &bull; {user.email}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Account Active
                </span>
                <span>&bull;</span>
                <span>
                  Member since {user.created_at ? new Date(user.created_at).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' }) : '2026'}
                </span>
                {user.last_login_at && (
                  <>
                    <span>&bull;</span>
                    <span>
                      Last login: {new Date(user.last_login_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            <Link
              href="/home"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-colors border border-white/15"
            >
              <span>Live Website</span>
              <span className="material-symbols-outlined text-sm!">open_in_new</span>
            </Link>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-navy text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy hover:border-gray-300'
          }`}
        >
          <span className="material-symbols-outlined text-lg!">person</span>
          <span>Profile Details</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'border-navy text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy hover:border-gray-300'
          }`}
        >
          <span className="material-symbols-outlined text-lg!">security</span>
          <span>Security &amp; Password</span>
        </button>
      </div>

      {/* TAB 1: Profile Details */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
            <h2 className="text-base font-bold text-navy flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-blue-600 text-xl!">edit</span>
              Edit Personal Details
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Update your name, contact information, and healthcare organization.
            </p>

            {profileMessage && (
              <div
                className={`p-4 rounded-xl text-xs sm:text-sm font-medium mb-6 flex items-center gap-2 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg!">
                  {profileMessage.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@hospital.co.za"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27 (0) 11 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Organization / Clinic</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Netcare Pretoria Hospital"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-navy hover:bg-navy-light text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isUpdatingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base!">save</span>
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Meta Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="material-symbols-outlined text-gray-500 text-lg!">badge</span>
              Account Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Username</span>
                <span className="font-mono font-semibold text-gray-800">@{user.username}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Account ID</span>
                <span className="font-mono font-semibold text-gray-800">#{user.id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Assigned Role</span>
                <span className="font-semibold text-navy">{user.role_name || (isAdmin ? 'Administrator' : 'Staff')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">Email Verification</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm!">verified</span>
                  Verified
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Access Level</span>
                <span className="font-semibold text-gray-700">
                  {isAdmin ? 'Full Unrestricted' : user.has_custom_permissions ? 'Role + Custom Overrides' : 'Role-Based'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
            <h2 className="text-base font-bold text-navy flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-blue-600 text-xl!">lock_reset</span>
              Change Your Password
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Ensure your account is protected with a secure password of at least 6 characters.
            </p>

            {passwordMessage && (
              <div
                className={`p-4 rounded-xl text-xs sm:text-sm font-medium mb-6 flex items-center gap-2 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg!">
                  {passwordMessage.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  >
                    <span className="material-symbols-outlined text-lg!">
                      {showCurrentPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  >
                    <span className="material-symbols-outlined text-lg!">
                      {showNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-navy hover:bg-navy-light text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base!">check</span>
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="material-symbols-outlined text-emerald-600 text-lg!">verified_user</span>
              Password Guidelines
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base! shrink-0">check_circle</span>
                <span>Minimum 6 characters long</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base! shrink-0">check_circle</span>
                <span>Combine letters, numbers, and symbols</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base! shrink-0">check_circle</span>
                <span>Do not reuse personal identifiers or old passwords</span>
              </li>
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
