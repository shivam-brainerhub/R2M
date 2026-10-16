"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adminUsersApi, UserProfile, ApiError } from '@/lib/api';
import CustomSelect from '@/components/CustomSelect';

type RoleFilter = 'all' | 'admin' | 'user';
type StatusFilter = 'all' | 'active' | 'suspended';
type VerificationFilter = 'all' | 'verified' | 'unverified';
type SortField = 'id' | 'username' | 'email' | 'created_at' | 'last_login_at';
type SortDirection = 'asc' | 'desc';

export default function AdminUsersPage() {
  const { user: currentAdmin, token } = useAuth();

  // Data & State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<VerificationFilter>('all');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [targetSuspendState, setTargetSuspendState] = useState<boolean>(false);

  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    username: '',
    full_name: '',
    phone: '',
    organization: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  });
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Notifications / Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminUsersApi.listUsers(token, {
        sort_by: sortField,
        sort_order: sortDirection,
      });
      setUsers(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load users';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [token, sortField, sortDirection]);

  useEffect(() => {
    let isMounted = true;
    if (!token) return;
    adminUsersApi
      .listUsers(token, {
        sort_by: sortField,
        sort_order: sortDirection,
      })
      .then((data) => {
        if (!isMounted) return;
        setUsers(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg = err instanceof ApiError ? err.message : 'Failed to load users';
        setError(msg);
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [token, sortField, sortDirection]);

  // Client-side filtering & search for quick responsive UX
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesUsername = u.username.toLowerCase().includes(query);
        const matchesEmail = u.email.toLowerCase().includes(query);
        const matchesName = u.full_name ? u.full_name.toLowerCase().includes(query) : false;
        if (!matchesUsername && !matchesEmail && !matchesName) return false;
      }

      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'suspended' && u.is_active) return false;

      // Verification filter
      if (verifiedFilter === 'verified' && !u.is_email_verified) return false;
      if (verifiedFilter === 'unverified' && u.is_email_verified) return false;

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter, verifiedFilter]);

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Action: Toggle Suspend / Active
  const handleToggleSuspendConfirm = async () => {
    if (!token || !selectedUser) return;
    setActionLoadingId(selectedUser.id);
    try {
      const updated = await adminUsersApi.toggleStatus(token, selectedUser.id, targetSuspendState);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(
        `User ${selectedUser.username} has been ${targetSuspendState ? 'reactivated' : 'suspended'}.`,
        'success'
      );
      setSuspendModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Action failed';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Delete user
  const handleDeleteUserConfirm = async () => {
    if (!token || !selectedUser) return;
    setActionLoadingId(selectedUser.id);
    try {
      await adminUsersApi.deleteUser(token, selectedUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      showToast(`User ${selectedUser.username} was permanently deleted.`, 'success');
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete user';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Set Password
  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUser) return;
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordError(null);
    setActionLoadingId(selectedUser.id);
    try {
      await adminUsersApi.setPassword(token, selectedUser.id, newPassword);
      showToast(`Password updated successfully for ${selectedUser.username}.`, 'success');
      setIsPasswordModalOpen(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to set password';
      setPasswordError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Resend Confirmation Email
  const handleResendConfirmation = async (u: UserProfile) => {
    if (!token) return;
    setActionLoadingId(u.id);
    try {
      const res = await adminUsersApi.resendConfirmation(token, u.id);
      showToast(res.message, 'success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to resend confirmation email';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Create New User
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreateUserError(null);

    if (!newUserData.email || !newUserData.username || !newUserData.password) {
      setCreateUserError('Please fill in all required fields.');
      return;
    }

    try {
      const created = await adminUsersApi.createUser(token, newUserData);
      setUsers((prev) => [created, ...prev]);
      showToast(`User ${created.username} created successfully.`, 'success');
      setCreateUserModalOpen(false);
      setNewUserData({ email: '', username: '', full_name: '', phone: '', organization: '', password: '', role: 'user' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create user';
      setCreateUserError(msg);
    }
  };

  // Quick stats summary
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const suspended = users.filter((u) => !u.is_active).length;
    const unconfirmed = users.filter((u) => !u.is_email_verified).length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return { total, active, suspended, unconfirmed, admins };
  }, [users]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification (Topmost layer above all modals & backdrops) */}
      {toast && (
        <div className="fixed top-6 right-6 z-100 animate-scale-in">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/20'
                : 'bg-rose-600 text-white border-rose-500 shadow-rose-950/20'
            }`}
          >
            <span className="material-symbols-outlined text-white text-lg!">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-80 cursor-pointer p-0.5 rounded"
              aria-label="Dismiss toast"
            >
              <span className="material-symbols-outlined text-sm!">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-navy rounded-2xl p-6 sm:p-7 text-white relative overflow-hidden shadow-lg border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-gold/30">
            <span className="w-2 h-2 rounded-full bg-gold"></span>
            Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            User Accounts &amp; Access Control
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 font-light max-w-2xl">
            Manage system administrators and healthcare customer accounts. Suspend access, reset credentials, re-dispatch confirmation emails, and regulate platform access.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCreateUserModalOpen(true)}
            className="bg-gold text-navy font-bold px-4 py-2.5 rounded-xl hover:bg-gold-bright transition-all duration-200 hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg!">person_add</span>
            Create User
          </button>
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-3.5 py-2.5 rounded-xl transition-all border border-white/15 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh user list"
          >
            <span className={`material-symbols-outlined text-lg! ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-black text-navy mt-1">{stats.total}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Platform members</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Authorized logins</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Suspended</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats.suspended}</p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Blocked access</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">Unconfirmed</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{stats.unconfirmed}</p>
          <p className="text-[11px] text-purple-600/80 mt-0.5">Pending verification</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Admins</p>
          <p className="text-2xl font-black text-navy mt-1">{stats.admins}</p>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Super administrators</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg!">
              search
            </span>
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer p-0.5"
              >
                <span className="material-symbols-outlined text-base!">cancel</span>
              </button>
            )}
          </div>

          {/* Quick Clear All Filters */}
          {(roleFilter !== 'all' || statusFilter !== 'all' || verifiedFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setRoleFilter('all');
                setStatusFilter('all');
                setVerifiedFilter('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold self-start lg:self-center cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm!">filter_alt_off</span>
              Reset filters
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Role:</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  roleFilter === 'all' ? 'bg-white text-navy shadow-xs' : 'text-gray-600 hover:text-navy'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  roleFilter === 'admin' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-navy'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRoleFilter('user')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  roleFilter === 'user' ? 'bg-slate-700 text-white shadow-xs' : 'text-gray-600 hover:text-navy'
                }`}
              >
                User
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Status:</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-navy shadow-xs' : 'text-gray-600 hover:text-navy'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-navy'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'suspended' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600 hover:text-navy'
                }`}
              >
                Suspended
              </button>
            </div>
          </div>

          {/* Email Verification Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Email:</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setVerifiedFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  verifiedFilter === 'all' ? 'bg-white text-navy shadow-xs' : 'text-gray-600 hover:text-navy'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVerifiedFilter('verified')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  verifiedFilter === 'verified' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-navy'
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setVerifiedFilter('unverified')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  verifiedFilter === 'unverified' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600 hover:text-navy'
                }`}
              >
                Unverified
              </button>
            </div>
          </div>

          <div className="ml-auto text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-navy">{filteredUsers.length}</span> of {users.length} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Loading user database...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">error</span>
            <p className="text-sm font-bold text-navy">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy-light"
            >
              Try Again
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center px-4">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">person_off</span>
            <h3 className="text-sm font-bold text-navy">No users found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting your search query or clear the active status/role filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th
                    className="px-5 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center gap-1">
                      <span>User Details</span>
                      {sortField === 'username' && (
                        <span className="material-symbols-outlined text-xs!">
                          {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Email &amp; Verification</span>
                      {sortField === 'email' && (
                        <span className="material-symbols-outlined text-xs!">
                          {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Joined</span>
                      {sortField === 'created_at' && (
                        <span className="material-symbols-outlined text-xs!">
                          {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = currentAdmin?.id === u.id;
                  const isActionLoading = actionLoadingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* User Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              u.role === 'admin'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {u.full_name
                              ? u.full_name.substring(0, 2).toUpperCase()
                              : u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-navy flex items-center gap-1.5 truncate">
                              <span>{u.username}</span>
                              {isCurrentAdmin && (
                                <span className="bg-gold/20 text-navy border border-gold/40 text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {u.full_name || <span className="italic text-gray-400">No name specified</span>}
                            </div>
                            {u.organization && (
                              <div className="text-[11px] text-gray-600 font-medium truncate flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[12px] text-gray-400">corporate_fare</span>
                                <span>{u.organization}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email & Verified */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-800 text-xs sm:text-sm">{u.email}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          {u.is_email_verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <span className="material-symbols-outlined text-[12px]!">check_circle</span>
                              Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <span className="material-symbols-outlined text-[12px]!">pending</span>
                              Unconfirmed
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                            u.role === 'admin'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Date Joined */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Resend Confirmation Email (Only if not verified) */}
                          {!u.is_email_verified && (
                            <button
                              onClick={() => handleResendConfirmation(u)}
                              disabled={isActionLoading}
                              title="Resend verification email"
                              className="p-1.5 text-purple-700 hover:bg-purple-100/70 rounded-lg transition-all border border-purple-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-base!">mark_email_read</span>
                            </button>
                          )}

                          {/* Set Password */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewPassword('');
                              setConfirmPassword('');
                              setPasswordError(null);
                              setIsPasswordModalOpen(true);
                            }}
                            title="Set / Reset Password"
                            className="p-1.5 text-blue-700 hover:bg-blue-100/70 rounded-lg transition-all border border-blue-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-base!">lock_reset</span>
                          </button>

                          {/* Suspend / Reactivate */}
                          {!isCurrentAdmin && (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setTargetSuspendState(!u.is_active);
                                setSuspendModalOpen(true);
                              }}
                              title={u.is_active ? 'Suspend account' : 'Reactivate account'}
                              className={`p-1.5 rounded-lg transition-all border cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xs ${
                                u.is_active
                                  ? 'text-amber-700 hover:bg-amber-100/70 border-amber-200'
                                  : 'text-emerald-700 hover:bg-emerald-100/70 border-emerald-200'
                              }`}
                            >
                              <span className="material-symbols-outlined text-base!">
                                {u.is_active ? 'pause_circle' : 'play_circle'}
                              </span>
                            </button>
                          )}

                          {/* Delete Account (Only visible for suspended accounts) */}
                          {!isCurrentAdmin && !u.is_active && (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setDeleteModalOpen(true);
                              }}
                              title="Permanently delete suspended account"
                              className="p-1.5 text-rose-700 hover:bg-rose-100/70 rounded-lg transition-all border border-rose-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-base!">delete</span>
                            </button>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setViewDetailsModalOpen(true);
                            }}
                            title="View user details"
                            className="p-1.5 text-gray-600 hover:text-navy hover:bg-slate-100 rounded-lg transition-all border border-gray-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-base!">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: View User Details */}
      {viewDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl!">account_circle</span>
                <h3 className="font-bold text-navy text-lg">User Profile</h3>
              </div>
              <button
                onClick={() => setViewDetailsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <span className="material-symbols-outlined text-lg!">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">User ID</span>
                <span className="font-mono font-bold text-navy">#{selectedUser.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Username</span>
                <span className="font-bold text-navy">{selectedUser.username}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Full Name</span>
                <span className="text-gray-800">{selectedUser.full_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Organization / Facility</span>
                <span className="text-gray-800">{selectedUser.organization || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Telephone / Mobile</span>
                <span className="text-gray-800">{selectedUser.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Email Address</span>
                <span className="text-gray-800">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Role</span>
                <span className="capitalize font-semibold text-navy">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Account Status</span>
                <span className={selectedUser.is_active ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {selectedUser.is_active ? 'Active' : 'Suspended'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Email Verification</span>
                <span className={selectedUser.is_email_verified ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {selectedUser.is_email_verified ? 'Verified' : 'Pending Confirmation'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500 font-medium">Created On</span>
                <span className="text-gray-600">
                  {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 font-medium">Last Login</span>
                <span className="text-gray-600">
                  {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString() : 'Never logged in'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewDetailsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-semibold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Set Password */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl!">lock_reset</span>
                <h3 className="font-bold text-navy text-lg">Set User Password</h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer rounded-lg"
              >
                <span className="material-symbols-outlined text-lg!">close</span>
              </button>
            </div>

            <form onSubmit={handleSetPasswordSubmit} className="pt-4 space-y-4 text-xs sm:text-sm">
              <p className="text-gray-600">
                Directly configure a new password for <span className="font-bold text-navy">{selectedUser.username}</span> ({selectedUser.email}).
              </p>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === selectedUser.id}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {actionLoadingId === selectedUser.id ? (
                    <span className="material-symbols-outlined text-sm! animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm!">save</span>
                  )}
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Suspend / Reactivate Confirmation */}
      {suspendModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  targetSuspendState ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <span className="material-symbols-outlined text-2xl!">
                  {targetSuspendState ? 'check_circle' : 'pause_circle'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-navy text-lg">
                  {targetSuspendState ? 'Reactivate Account' : 'Suspend Account'}
                </h3>
                <p className="text-xs text-gray-500">Confirm access state change</p>
              </div>
            </div>

            <p className="text-gray-600 text-xs sm:text-sm mb-6">
              {targetSuspendState
                ? `Are you sure you want to reactivate user "${selectedUser.username}"? They will regain access to their account and quotation requests.`
                : `Are you sure you want to suspend user "${selectedUser.username}"? They will be immediately blocked from signing into the platform.`}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-semibold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleSuspendConfirm}
                disabled={actionLoadingId === selectedUser.id}
                className={`px-4 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-colors ${
                  targetSuspendState
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionLoadingId === selectedUser.id && (
                  <span className="material-symbols-outlined text-sm! animate-spin">refresh</span>
                )}
                {targetSuspendState ? 'Confirm Reactivation' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl!">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-navy text-lg">Delete User Account</h3>
                <p className="text-xs text-rose-600 font-semibold">Irreversible action</p>
              </div>
            </div>

            <p className="text-gray-600 text-xs sm:text-sm mb-6">
              Are you sure you want to permanently delete user <span className="font-bold text-navy">{selectedUser.username}</span> ({selectedUser.email})? All account records will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-semibold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUserConfirm}
                disabled={actionLoadingId === selectedUser.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
              >
                {actionLoadingId === selectedUser.id && (
                  <span className="material-symbols-outlined text-sm! animate-spin">refresh</span>
                )}
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Create User */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl!">person_add</span>
                <h3 className="font-bold text-navy text-lg">Add New User</h3>
              </div>
              <button
                onClick={() => setCreateUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer rounded-lg"
              >
                <span className="material-symbols-outlined text-lg!">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="pt-4 space-y-3.5 text-xs sm:text-sm">
              {createUserError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {createUserError}
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="e.g. purchaser@hospital.co.za"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  placeholder="e.g. dr_smith"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  placeholder="e.g. Dr. John Smith"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Organisation / Facility</label>
                <input
                  type="text"
                  value={newUserData.organization}
                  onChange={(e) => setNewUserData({ ...newUserData, organization: e.target.value })}
                  placeholder="e.g. Mediclinic Panorama / Public Hospital"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Telephone / Mobile</label>
                <input
                  type="tel"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  placeholder="e.g. +27 21 555 0100"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">User Role</label>
                <CustomSelect
                  value={newUserData.role}
                  onChange={(val) => setNewUserData({ ...newUserData, role: val as 'admin' | 'user' })}
                  options={[
                    { value: 'user', label: 'User (Healthcare Client)' },
                    { value: 'admin', label: 'Admin (Full Control)' },
                  ]}
                  size="md"
                  variant="slate"
                  className="w-full"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy hover:bg-navy-light text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm!">check</span>
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
