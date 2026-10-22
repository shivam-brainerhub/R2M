"use client";

import CustomSelect from "@/components/CustomSelect";
import AdminPagination from "@/components/admin/AdminPagination";
import { useAuth } from "@/context/AuthContext";
import {
  AdminCreateUserPayload,
  adminRolesApi,
  AdminUpdateUserPayload,
  adminUsersApi,
  ApiError,
  PermissionLevel,
  PermissionSection,
  Role,
  UserProfile,
} from "@/lib/api";
import { getUserInitials } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

type StatusFilter = "all" | "active" | "suspended";
type VerificationFilter = "all" | "verified" | "unverified";
type SortField = "id" | "username" | "email" | "created_at" | "last_login_at";
type SortDirection = "asc" | "desc";

interface SectionInfo {
  id: PermissionSection;
  label: string;
  icon: string;
  description: string;
}

const PERMISSION_SECTIONS: SectionInfo[] = [
  {
    id: "quotes",
    label: "Quotation Requests",
    icon: "request_quote",
    description: "Review RFQs, issue quotes, update pricing & notes",
  },
  {
    id: "products",
    label: "Products Catalogue",
    icon: "inventory_2",
    description: "Manage products, specs, photos, and brochures",
  },
  {
    id: "categories",
    label: "Categories & Brands",
    icon: "category",
    description: "Manage medical equipment categories, brands, specifications",
  },
  {
    id: "inquiries",
    label: "Inquiries & Leads",
    icon: "mark_email_unread",
    description: "Contact messages and supplier applications",
  },
  {
    id: "content",
    label: "Site Content & CMS",
    icon: "web",
    description: "Homepage copy, banners, about section, policy text",
  },
  {
    id: "users",
    label: "User Accounts",
    icon: "manage_accounts",
    description: "Manage system users, hospital accounts, and credentials",
  },
  {
    id: "roles",
    label: "Roles & IAM",
    icon: "shield_person",
    description: "Define roles and system permission profiles",
  },
];

export default function AdminUsersPage() {
  const { user: currentAdmin, token, hasPermission, isAdmin } = useAuth();
  const canWriteUsers = hasPermission("users", "write");

  // Data & State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verifiedFilter, setVerifiedFilter] =
    useState<VerificationFilter>("all");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [targetSuspendState, setTargetSuspendState] = useState<boolean>(false);

  // Create User Modal State
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState<{
    email: string;
    username: string;
    full_name: string;
    phone: string;
    organization: string;
    password: string;
    role: string;
    role_id?: number | null;
  }>({
    email: "",
    username: "",
    full_name: "",
    phone: "",
    organization: "",
    password: "",
    role: "user",
    role_id: null,
  });
  const [showCreateCustomPerms, setShowCreateCustomPerms] = useState(false);
  const [createCustomPerms, setCreateCustomPerms] = useState<
    Partial<Record<PermissionSection, PermissionLevel>>
  >({});
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit User Modal State
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<{
    id: number;
    email: string;
    username: string;
    full_name: string;
    phone: string;
    organization: string;
    role: string;
    role_id?: number | null;
    custom_permissions: Partial<Record<PermissionSection, PermissionLevel>>;
  } | null>(null);
  const [showEditCustomPerms, setShowEditCustomPerms] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Notifications / Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
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
      const roleParam = roleFilter !== "all" ? roleFilter : undefined;
      const isActiveParam =
        statusFilter === "active"
          ? true
          : statusFilter === "suspended"
            ? false
            : undefined;
      const isEmailVerifiedParam =
        verifiedFilter === "verified"
          ? true
          : verifiedFilter === "unverified"
            ? false
            : undefined;

      const [usersRes, rolesData] = await Promise.all([
        adminUsersApi.listUsersPaginated(token, {
          search: searchQuery.trim() || undefined,
          role: roleParam,
          is_active: isActiveParam,
          is_email_verified: isEmailVerifiedParam,
          sort_by: sortField,
          sort_order: sortDirection,
          skip: (currentPage - 1) * pageSize,
          limit: pageSize,
        }),
        adminRolesApi.listRoles(token).catch(() => []),
      ]);
      setUsers(usersRes.items);
      setTotalUsers(usersRes.total);
      setRoles(rolesData);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to load users";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [
    token,
    searchQuery,
    roleFilter,
    statusFilter,
    verifiedFilter,
    sortField,
    sortDirection,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Lock background screen scroll when any modal is open
  const isAnyModalOpen =
    viewDetailsModalOpen ||
    isPasswordModalOpen ||
    suspendModalOpen ||
    deleteModalOpen ||
    createUserModalOpen ||
    editUserModalOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAnyModalOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, verifiedFilter]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const paginatedUsers = users;

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Action: Toggle Suspend / Active
  const handleToggleSuspendConfirm = async () => {
    if (!token || !selectedUser) return;
    setActionLoadingId(selectedUser.id);
    try {
      const updated = await adminUsersApi.toggleStatus(
        token,
        selectedUser.id,
        targetSuspendState,
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(
        `User ${selectedUser.username} has been ${
          targetSuspendState ? "reactivated" : "suspended"
        }.`,
        "success",
      );
      setSuspendModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Action failed";
      showToast(msg, "error");
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
      showToast(
        `User ${selectedUser.username} was permanently deleted.`,
        "success",
      );
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to delete user";
      showToast(msg, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action: Set Password
  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUser) return;
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordError(null);
    setActionLoadingId(selectedUser.id);
    try {
      await adminUsersApi.setPassword(token, selectedUser.id, newPassword);
      showToast(
        `Password updated successfully for ${selectedUser.username}.`,
        "success",
      );
      setIsPasswordModalOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to set password";
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
      showToast(res.message, "success");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to resend confirmation email";
      showToast(msg, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u: UserProfile) => {
    setSelectedUser(u);
    let matchedRoleId = u.role_id;
    if (!matchedRoleId && roles.length > 0) {
      const found = roles.find(
        (r) =>
          r.slug === u.role || r.name.toLowerCase() === u.role.toLowerCase(),
      );
      if (found) matchedRoleId = found.id;
    }

    setEditUserData({
      id: u.id,
      email: u.email,
      username: u.username,
      full_name: u.full_name || "",
      phone: u.phone || "",
      organization: u.organization || "",
      role: u.role,
      role_id: matchedRoleId,
      custom_permissions: u.custom_permissions
        ? { ...u.custom_permissions }
        : {},
    });
    setShowEditCustomPerms(
      Boolean(
        u.has_custom_permissions ||
          (u.custom_permissions &&
            Object.keys(u.custom_permissions).length > 0),
      ),
    );
    setEditUserError(null);
    setEditUserModalOpen(true);
  };

  // Action: Submit Edit User
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editUserData) return;
    setIsSubmittingEdit(true);
    setEditUserError(null);

    try {
      const payload: AdminUpdateUserPayload = {
        full_name: editUserData.full_name.trim() || undefined,
        phone: editUserData.phone.trim() || undefined,
        organization: editUserData.organization.trim() || undefined,
        role: editUserData.role,
        role_id: editUserData.role_id || undefined,
        custom_permissions: showEditCustomPerms
          ? editUserData.custom_permissions
          : {},
      };

      const updated = await adminUsersApi.updateUser(
        token,
        editUserData.id,
        payload,
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(`User ${updated.username} updated successfully.`, "success");
      setEditUserModalOpen(false);
      setEditUserData(null);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to update user";
      setEditUserError(msg);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Action: Create New User
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreateUserError(null);

    if (!newUserData.email || !newUserData.username || !newUserData.password) {
      setCreateUserError("Please fill in all required fields.");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const payload: AdminCreateUserPayload = {
        email: newUserData.email.trim(),
        username: newUserData.username.trim(),
        password: newUserData.password,
        full_name: newUserData.full_name.trim() || undefined,
        phone: newUserData.phone.trim() || undefined,
        organization: newUserData.organization.trim() || undefined,
        role: newUserData.role,
        role_id: newUserData.role_id || undefined,
        custom_permissions:
          showCreateCustomPerms && Object.keys(createCustomPerms).length > 0
            ? createCustomPerms
            : null,
      };

      const created = await adminUsersApi.createUser(token, payload);
      setUsers((prev) => [created, ...prev]);
      showToast(`User ${created.username} created successfully.`, "success");
      setCreateUserModalOpen(false);
      setNewUserData({
        email: "",
        username: "",
        full_name: "",
        phone: "",
        organization: "",
        password: "",
        role: "user",
        role_id: null,
      });
      setCreateCustomPerms({});
      setShowCreateCustomPerms(false);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to create user";
      setCreateUserError(msg);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Quick stats summary
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const suspended = users.filter((u) => !u.is_active).length;
    const unconfirmed = users.filter((u) => !u.is_email_verified).length;
    const customPerms = users.filter((u) => u.has_custom_permissions).length;
    return { total, active, suspended, unconfirmed, customPerms };
  }, [users]);

  // Selected role for Create modal helper
  const createSelectedRoleObj = useMemo(() => {
    if (newUserData.role_id) {
      return roles.find((r) => r.id === newUserData.role_id) || null;
    }
    return roles.find((r) => r.slug === newUserData.role) || null;
  }, [roles, newUserData.role_id, newUserData.role]);

  // Selected role for Edit modal helper
  const editSelectedRoleObj = useMemo(() => {
    if (!editUserData) return null;
    if (editUserData.role_id) {
      return roles.find((r) => r.id === editUserData.role_id) || null;
    }
    return roles.find((r) => r.slug === editUserData.role) || null;
  }, [roles, editUserData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-100 animate-scale-in">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm font-semibold ${
              toast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/20"
                : "bg-rose-600 text-white border-rose-500 shadow-rose-950/20"
            }`}
          >
            <span className="material-symbols-outlined text-white text-lg!">
              {toast.type === "success" ? "check_circle" : "error"}
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
            Administration &amp; IAM
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            User Accounts &amp; Permissions
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 font-light max-w-2xl">
            Manage system administrators, staff roles, and healthcare clients.
            Configure individual section permissions, reset credentials, and
            govern access.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {canWriteUsers && (
            <button
              onClick={() => {
                setCreateUserError(null);
                setShowCreateCustomPerms(false);
                setCreateCustomPerms({});
                setCreateUserModalOpen(true);
              }}
              className="bg-gold text-navy font-bold px-4 py-2.5 rounded-xl hover:bg-gold-bright transition-all duration-200 hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg!">
                person_add
              </span>
              Create User
            </button>
          )}
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-3.5 py-2.5 rounded-xl transition-all border border-white/15 text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh user list"
          >
            <span
              className={`material-symbols-outlined text-lg! ${
                isLoading ? "animate-spin" : ""
              }`}
            >
              refresh
            </span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {!canWriteUsers && (
        <div className="bg-amber-50/90 border border-amber-200/90 text-amber-900 rounded-2xl p-4 flex items-center gap-3 text-xs leading-relaxed">
          <span className="material-symbols-outlined text-amber-600 text-xl! shrink-0">
            visibility
          </span>
          <div>
            <p className="font-bold text-amber-950">
              Read-Only User Directory View
            </p>
            <p className="text-amber-800/90 mt-0.5">
              Your account has read-only access to user accounts.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Total Users
          </p>
          <p className="text-2xl font-black text-navy mt-1">{stats.total}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Platform members</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Active
          </p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {stats.active}
          </p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">
            Authorized logins
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
            Suspended
          </p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {stats.suspended}
          </p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Blocked access</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">
            Unconfirmed
          </p>
          <p className="text-2xl font-black text-purple-700 mt-1">
            {stats.unconfirmed}
          </p>
          <p className="text-[11px] text-purple-600/80 mt-0.5">
            Pending verification
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Custom Perms
          </p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {stats.customPerms}
          </p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">
            User-level overrides
          </p>
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
              placeholder="Search by name, email, username, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-navy"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer p-0.5"
              >
                <span className="material-symbols-outlined text-base!">
                  cancel
                </span>
              </button>
            )}
          </div>

          {/* Quick Clear All Filters */}
          {(roleFilter !== "all" ||
            statusFilter !== "all" ||
            verifiedFilter !== "all" ||
            searchQuery) && (
            <button
              onClick={() => {
                setRoleFilter("all");
                setStatusFilter("all");
                setVerifiedFilter("all");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold self-start lg:self-center cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm!">
                filter_alt_off
              </span>
              Reset filters
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Role:</span>
            <CustomSelect
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              options={[
                { value: "all", label: "All Roles" },
                ...roles.map((r) => ({ value: r.slug, label: r.name })),
              ]}
              size="sm"
              variant="slate"
              className="min-w-36"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Status:</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-white text-navy shadow-xs"
                    : "text-gray-600 hover:text-navy"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-navy"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("suspended")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === "suspended"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-navy"
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
                onClick={() => setVerifiedFilter("all")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  verifiedFilter === "all"
                    ? "bg-white text-navy shadow-xs"
                    : "text-gray-600 hover:text-navy"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVerifiedFilter("verified")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  verifiedFilter === "verified"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-navy"
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setVerifiedFilter("unverified")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  verifiedFilter === "unverified"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-navy"
                }`}
              >
                Unverified
              </button>
            </div>
          </div>

          <div className="ml-auto text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-navy">{users.length}</span>{" "}
            of <span className="font-bold text-navy">{totalUsers}</span> users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-medium">
              Loading user database...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center px-4">
            <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">
              error
            </span>
            <p className="text-sm font-bold text-navy">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy-light"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center px-4">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">
              person_off
            </span>
            <h3 className="text-sm font-bold text-navy">No users found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting your search query or clear the active status/role
              filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-200">
                  <tr>
                    <th
                      className="px-5 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("username")}
                    >
                      <div className="flex items-center gap-1">
                        <span>User Details</span>
                        {sortField === "username" && (
                          <span className="material-symbols-outlined text-xs!">
                            {sortDirection === "asc"
                              ? "arrow_upward"
                              : "arrow_downward"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Email &amp; Verification</span>
                        {sortField === "email" && (
                          <span className="material-symbols-outlined text-xs!">
                            {sortDirection === "asc"
                              ? "arrow_upward"
                              : "arrow_downward"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3">Role &amp; Permissions</th>
                    <th className="px-4 py-3">Status</th>
                    <th
                      className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Joined</span>
                        {sortField === "created_at" && (
                          <span className="material-symbols-outlined text-xs!">
                            {sortDirection === "asc"
                              ? "arrow_upward"
                              : "arrow_downward"}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map((u) => {
                    const isCurrentAdmin = currentAdmin?.id === u.id;
                    const isActionLoading = actionLoadingId === u.id;
                    const targetIsAdmin =
                      u.is_admin || u.role?.toLowerCase() === "admin";
                    const canManageThisUser =
                      canWriteUsers && (isAdmin || !targetIsAdmin);

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* User Info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                u.is_admin || u.role?.toLowerCase() === "admin"
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {getUserInitials(u.full_name, u.username)}
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
                                {u.full_name || (
                                  <span className="italic text-gray-400">
                                    No name specified
                                  </span>
                                )}
                              </div>
                              {u.organization && (
                                <div className="text-[11px] text-gray-600 font-medium truncate flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[12px] text-gray-400">
                                    corporate_fare
                                  </span>
                                  <span>{u.organization}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email & Verified */}
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-800 text-xs sm:text-sm">
                            {u.email}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            {u.is_email_verified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[12px]!">
                                  check_circle
                                </span>
                                Confirmed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[12px]!">
                                  pending
                                </span>
                                Unconfirmed
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Role & Permissions Badge */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide border ${
                                u.is_admin || u.role?.toLowerCase() === "admin"
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {u.role_name || u.role}
                            </span>
                            {u.has_custom_permissions && (
                              <span
                                className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full"
                                title="User has customized section permission overrides"
                              >
                                <span className="material-symbols-outlined text-[10px]!">
                                  tune
                                </span>
                                Custom Overrides
                              </span>
                            )}
                          </div>
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
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString()
                            : "N/A"}
                        </td>

                        {/* Action buttons */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {canManageThisUser ? (
                              <>
                                {/* Edit User & Permissions */}
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  title="Edit user profile and section permissions"
                                  className="p-1.5 text-blue-700 hover:bg-blue-100/70 rounded-lg transition-all border border-blue-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-base!">
                                    edit
                                  </span>
                                </button>

                                {/* Resend Confirmation Email (Only if not verified) */}
                                {!u.is_email_verified && (
                                  <button
                                    onClick={() => handleResendConfirmation(u)}
                                    disabled={isActionLoading}
                                    title="Resend verification email"
                                    className="p-1.5 text-purple-700 hover:bg-purple-100/70 rounded-lg transition-all border border-purple-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xs"
                                  >
                                    <span className="material-symbols-outlined text-base!">
                                      mark_email_read
                                    </span>
                                  </button>
                                )}

                                {/* Set Password */}
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setNewPassword("");
                                    setConfirmPassword("");
                                    setPasswordError(null);
                                    setIsPasswordModalOpen(true);
                                  }}
                                  title="Set / Reset Password"
                                  className="p-1.5 text-indigo-700 hover:bg-indigo-100/70 rounded-lg transition-all border border-indigo-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-base!">
                                    lock_reset
                                  </span>
                                </button>

                                {/* Suspend / Reactivate */}
                                {!isCurrentAdmin && (
                                  <button
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setTargetSuspendState(!u.is_active);
                                      setSuspendModalOpen(true);
                                    }}
                                    title={
                                      u.is_active
                                        ? "Suspend account"
                                        : "Reactivate account"
                                    }
                                    className={`p-1.5 rounded-lg transition-all border cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xs ${
                                      u.is_active
                                        ? "text-amber-700 hover:bg-amber-100/70 border-amber-200"
                                        : "text-emerald-700 hover:bg-emerald-100/70 border-emerald-200"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-base!">
                                      {u.is_active
                                        ? "pause_circle"
                                        : "play_circle"}
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
                                    <span className="material-symbols-outlined text-base!">
                                      delete
                                    </span>
                                  </button>
                                )}

                                {/* View details */}
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setViewDetailsModalOpen(true);
                                  }}
                                  title="View user details and effective permissions"
                                  className="p-1.5 text-gray-600 hover:text-navy hover:bg-slate-100 rounded-lg transition-all border border-gray-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-base!">
                                    visibility
                                  </span>
                                </button>
                              </>
                            ) : (
                              /* Read-only or protected admin view button */
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setViewDetailsModalOpen(true);
                                }}
                                title="View user details and effective permissions"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy border border-gray-200 transition-colors cursor-pointer shadow-2xs"
                              >
                                <span className="material-symbols-outlined text-sm!">
                                  visibility
                                </span>
                                <span>View Details</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalUsers}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              itemLabel="users"
            />
          </>
        )}
      </div>

      {/* MODAL 1: View User Details */}
      {viewDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl!">
                  account_circle
                </span>
                <h3 className="font-bold text-navy text-lg">
                  User Profile &amp; Access
                </h3>
              </div>
              <button
                onClick={() => setViewDetailsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg!">
                  close
                </span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4 text-xs sm:text-sm overscroll-contain">
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">User ID</span>
                  <span className="font-mono font-bold text-navy">
                    #{selectedUser.id}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Username</span>
                  <span className="font-bold text-navy">
                    {selectedUser.username}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Full Name</span>
                  <span className="text-gray-800">
                    {selectedUser.full_name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">
                    Organization / Facility
                  </span>
                  <span className="text-gray-800">
                    {selectedUser.organization || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">
                    Telephone / Mobile
                  </span>
                  <span className="text-gray-800">
                    {selectedUser.phone || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">
                    Email Address
                  </span>
                  <span className="text-gray-800">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">
                    Assigned Role
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-navy">
                      {selectedUser.role_name || selectedUser.role}
                    </span>
                    {selectedUser.has_custom_permissions && (
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-full">
                        Customized
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">
                    Account Status
                  </span>
                  <span
                    className={
                      selectedUser.is_active
                        ? "text-emerald-700 font-bold"
                        : "text-rose-700 font-bold"
                    }
                  >
                    {selectedUser.is_active ? "Active" : "Suspended"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">
                    Email Verification
                  </span>
                  <span
                    className={
                      selectedUser.is_email_verified
                        ? "text-emerald-700 font-bold"
                        : "text-amber-700 font-bold"
                    }
                  >
                    {selectedUser.is_email_verified
                      ? "Verified"
                      : "Pending Confirmation"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Created On</span>
                  <span className="text-gray-600">
                    {selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Last Login</span>
                  <span className="text-gray-600">
                    {selectedUser.last_login_at
                      ? new Date(selectedUser.last_login_at).toLocaleString()
                      : "Never logged in"}
                  </span>
                </div>
              </div>

              {/* Effective Section Permissions Breakdown */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm! text-blue-600">
                    verified_user
                  </span>
                  Effective Permissions Matrix
                </h4>
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-gray-200">
                  {PERMISSION_SECTIONS.map((sec) => {
                    const effectiveLevel =
                      selectedUser.permissions?.[sec.id] || "none";
                    const isCustomized =
                      selectedUser.custom_permissions &&
                      sec.id in selectedUser.custom_permissions;

                    return (
                      <div
                        key={sec.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-gray-500 text-sm!">
                            {sec.icon}
                          </span>
                          <span className="font-semibold text-gray-800">
                            {sec.label}
                          </span>
                          {isCustomized && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">
                              Overridden
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            effectiveLevel === "read_write"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : effectiveLevel === "read"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {effectiveLevel === "read_write"
                            ? "Read & Write"
                            : effectiveLevel === "read"
                              ? "Read-Only"
                              : "None"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-center shrink-0 bg-white">
              <button
                onClick={() => {
                  setViewDetailsModalOpen(false);
                  handleOpenEditUser(selectedUser);
                }}
                className="px-3.5 py-2 bg-navy text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:bg-navy-light transition-colors"
              >
                <span className="material-symbols-outlined text-sm!">edit</span>
                Edit User &amp; Permissions
              </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl!">
                  lock_reset
                </span>
                <h3 className="font-bold text-navy text-lg">
                  Set User Password
                </h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer rounded-lg"
              >
                <span className="material-symbols-outlined text-lg!">
                  close
                </span>
              </button>
            </div>

            <form
              onSubmit={handleSetPasswordSubmit}
              className="pt-4 space-y-4 text-xs sm:text-sm"
            >
              <p className="text-gray-600">
                Directly configure a new password for{" "}
                <span className="font-bold text-navy">
                  {selectedUser.username}
                </span>{" "}
                ({selectedUser.email}).
              </p>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
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
                    <span className="material-symbols-outlined text-sm! animate-spin">
                      refresh
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-sm!">
                      save
                    </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  targetSuspendState
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                <span className="material-symbols-outlined text-2xl!">
                  {targetSuspendState ? "check_circle" : "pause_circle"}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-navy text-lg">
                  {targetSuspendState
                    ? "Reactivate Account"
                    : "Suspend Account"}
                </h3>
                <p className="text-xs text-gray-500">
                  Confirm access state change
                </p>
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
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {actionLoadingId === selectedUser.id && (
                  <span className="material-symbols-outlined text-sm! animate-spin">
                    refresh
                  </span>
                )}
                {targetSuspendState
                  ? "Confirm Reactivation"
                  : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl!">
                  warning
                </span>
              </div>
              <div>
                <h3 className="font-bold text-navy text-lg">
                  Delete User Account
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Irreversible action
                </p>
              </div>
            </div>

            <p className="text-gray-600 text-xs sm:text-sm mb-6">
              Are you sure you want to permanently delete user{" "}
              <span className="font-bold text-navy">
                {selectedUser.username}
              </span>{" "}
              ({selectedUser.email})? All account records will be permanently
              removed.
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
                  <span className="material-symbols-outlined text-sm! animate-spin">
                    refresh
                  </span>
                )}
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Create User */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl!">
                  person_add
                </span>
                <h3 className="font-bold text-navy text-lg">Add New User</h3>
              </div>
              <button
                onClick={() => setCreateUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer rounded-lg"
              >
                <span className="material-symbols-outlined text-lg!">
                  close
                </span>
              </button>
            </div>

            <form
              onSubmit={handleCreateUserSubmit}
              className="pt-4 flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 text-xs sm:text-sm overscroll-contain">
                {createUserError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                    {createUserError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newUserData.email}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          email: e.target.value,
                        })
                      }
                      placeholder="e.g. purchaser@hospital.co.za"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
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
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          username: e.target.value,
                        })
                      }
                      placeholder="e.g. dr_smith"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newUserData.full_name}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          full_name: e.target.value,
                        })
                      }
                      placeholder="e.g. Dr. John Smith"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Telephone / Mobile
                    </label>
                    <input
                      type="tel"
                      value={newUserData.phone}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="e.g. +27 21 555 0100"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Organisation / Facility
                  </label>
                  <input
                    type="text"
                    value={newUserData.organization}
                    onChange={(e) =>
                      setNewUserData({
                        ...newUserData,
                        organization: e.target.value,
                      })
                    }
                    placeholder="e.g. Mediclinic Panorama / Public Hospital"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
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
                    onChange={(e) =>
                      setNewUserData({
                        ...newUserData,
                        password: e.target.value,
                      })
                    }
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Assigned Role
                  </label>
                  <CustomSelect
                    value={
                      newUserData.role_id
                        ? String(newUserData.role_id)
                        : newUserData.role
                    }
                    onChange={(val) => {
                      const matchedRole = roles.find(
                        (r) => String(r.id) === val || r.slug === val,
                      );
                      if (matchedRole) {
                        setNewUserData({
                          ...newUserData,
                          role_id: matchedRole.id,
                          role: matchedRole.slug,
                        });
                      } else {
                        setNewUserData({
                          ...newUserData,
                          role_id: null,
                          role: val,
                        });
                      }
                    }}
                    options={
                      roles.length > 0
                        ? roles
                            .filter(
                              (r) =>
                                isAdmin || r.slug.toLowerCase() !== "admin",
                            )
                            .map((r) => ({
                              value: String(r.id),
                              label: `${r.name} ${
                                r.is_system ? "(System)" : ""
                              }`,
                            }))
                        : isAdmin
                          ? [
                              {
                                value: "user",
                                label: "User (Healthcare Client)",
                              },
                              { value: "admin", label: "Admin (Full Control)" },
                            ]
                          : [
                              {
                                value: "user",
                                label: "User (Healthcare Client)",
                              },
                            ]
                    }
                    size="md"
                    variant="slate"
                    className="w-full"
                  />
                  {createSelectedRoleObj?.description && (
                    <p className="text-[11px] text-gray-500 mt-1 italic">
                      {createSelectedRoleObj.description}
                    </p>
                  )}
                </div>

                {/* Optional Custom Permissions Overrides Accordion */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-navy">
                        Customize Section Permissions
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Override specific section permissions just for this
                        user.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCreateCustomPerms(!showCreateCustomPerms)
                      }
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        showCreateCustomPerms
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-slate-100 text-gray-600 border-gray-200 hover:text-navy"
                      }`}
                    >
                      {showCreateCustomPerms
                        ? "Hide Customizer"
                        : "Customize Permissions"}
                    </button>
                  </div>

                  {showCreateCustomPerms && (
                    <div className="mt-3 p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-gray-200 text-[11px] text-gray-500 font-semibold">
                        <span>Backend Section</span>
                        <span>User Access Level</span>
                      </div>
                      {PERMISSION_SECTIONS.filter(
                        (sec) => isAdmin || sec.id !== "roles",
                      ).map((sec) => {
                        const roleDefault = (createSelectedRoleObj
                          ?.permissions?.[sec.id] || "none") as PermissionLevel;
                        const hasOverride = sec.id in createCustomPerms;
                        const currentVal = hasOverride
                          ? createCustomPerms[sec.id]
                          : "inherit";

                        return (
                          <div
                            key={sec.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1.5 px-2 bg-white rounded-lg border border-gray-200/60"
                          >
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-gray-500 text-base!">
                                {sec.icon}
                              </span>
                              <div>
                                <span className="font-bold text-navy text-xs">
                                  {sec.label}
                                </span>
                                <span className="text-[10px] text-gray-400 block">
                                  Role default:{" "}
                                  <strong className="uppercase">
                                    {roleDefault}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-slate-50 text-[11px] shrink-0 self-start sm:self-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...createCustomPerms };
                                  delete updated[sec.id];
                                  setCreateCustomPerms(updated);
                                }}
                                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                  !hasOverride
                                    ? "bg-navy text-white shadow-xs"
                                    : "text-gray-600 hover:text-navy"
                                }`}
                              >
                                Inherit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateCustomPerms({
                                    ...createCustomPerms,
                                    [sec.id]: "none",
                                  });
                                }}
                                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                  hasOverride && currentVal === "none"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "text-gray-600 hover:text-navy"
                                }`}
                              >
                                None
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateCustomPerms({
                                    ...createCustomPerms,
                                    [sec.id]: "read",
                                  });
                                }}
                                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                  hasOverride && currentVal === "read"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "text-gray-600 hover:text-navy"
                                }`}
                              >
                                Read
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateCustomPerms({
                                    ...createCustomPerms,
                                    [sec.id]: "read_write",
                                  });
                                }}
                                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                  hasOverride && currentVal === "read_write"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-gray-600 hover:text-navy"
                                }`}
                              >
                                Read &amp; Write
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setCreateUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-2 bg-navy hover:bg-navy-light text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSubmittingCreate ? (
                    <span className="material-symbols-outlined text-sm! animate-spin">
                      refresh
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-sm!">
                      check
                    </span>
                  )}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Edit User & Custom Permissions */}
      {editUserModalOpen && editUserData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl!">
                  manage_accounts
                </span>
                <h3 className="font-bold text-navy text-lg">
                  Edit User: {editUserData.username}
                </h3>
                {!canWriteUsers && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                    Read-Only
                  </span>
                )}
              </div>
              <button
                onClick={() => setEditUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer rounded-lg"
              >
                <span className="material-symbols-outlined text-lg!">
                  close
                </span>
              </button>
            </div>

            <form
              onSubmit={handleEditUserSubmit}
              className="pt-4 flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 text-xs sm:text-sm overscroll-contain">
                <fieldset
                  disabled={!canWriteUsers}
                  className="space-y-3.5 border-0 p-0 m-0 min-w-0"
                >
                  {!canWriteUsers && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-700 text-sm!">
                        lock
                      </span>
                      <span>
                        You are in view-only mode. Write permission is required
                        to save changes.
                      </span>
                    </div>
                  )}
                  {editUserError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                      {editUserError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">
                        Email
                      </label>
                      <input
                        type="text"
                        disabled
                        value={editUserData.email}
                        className="w-full px-3.5 py-2 bg-gray-100 text-gray-600 border border-gray-200 rounded-xl cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-500 font-semibold mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        disabled
                        value={editUserData.username}
                        className="w-full px-3.5 py-2 bg-gray-100 text-gray-600 border border-gray-200 rounded-xl cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editUserData.full_name}
                        onChange={(e) =>
                          setEditUserData({
                            ...editUserData,
                            full_name: e.target.value,
                          })
                        }
                        placeholder="e.g. Dr. John Smith"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Telephone / Mobile
                      </label>
                      <input
                        type="tel"
                        value={editUserData.phone}
                        onChange={(e) =>
                          setEditUserData({
                            ...editUserData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="e.g. +27 21 555 0100"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Organisation / Facility
                    </label>
                    <input
                      type="text"
                      value={editUserData.organization}
                      onChange={(e) =>
                        setEditUserData({
                          ...editUserData,
                          organization: e.target.value,
                        })
                      }
                      placeholder="e.g. Mediclinic Panorama / Public Hospital"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Assigned Role
                    </label>
                    <CustomSelect
                      value={
                        editUserData.role_id
                          ? String(editUserData.role_id)
                          : editUserData.role
                      }
                      onChange={(val) => {
                        const matchedRole = roles.find(
                          (r) => String(r.id) === val || r.slug === val,
                        );
                        if (matchedRole) {
                          setEditUserData({
                            ...editUserData,
                            role_id: matchedRole.id,
                            role: matchedRole.slug,
                          });
                        } else {
                          setEditUserData({
                            ...editUserData,
                            role_id: null,
                            role: val,
                          });
                        }
                      }}
                      options={
                        roles.length > 0
                          ? roles
                              .filter(
                                (r) =>
                                  isAdmin || r.slug.toLowerCase() !== "admin",
                              )
                              .map((r) => ({
                                value: String(r.id),
                                label: `${r.name} ${
                                  r.is_system ? "(System)" : ""
                                }`,
                              }))
                          : isAdmin
                            ? [
                                {
                                  value: "user",
                                  label: "User (Healthcare Client)",
                                },
                                {
                                  value: "admin",
                                  label: "Admin (Full Control)",
                                },
                              ]
                            : [
                                {
                                  value: "user",
                                  label: "User (Healthcare Client)",
                                },
                              ]
                      }
                      size="md"
                      variant="slate"
                      className="w-full"
                    />
                    {editSelectedRoleObj?.description && (
                      <p className="text-[11px] text-gray-500 mt-1 italic">
                        {editSelectedRoleObj.description}
                      </p>
                    )}
                  </div>

                  {/* Custom Permissions Overrides Section */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-navy">
                          Section Permissions Overrides
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Customize or override access permissions for
                          individual sections for this user.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canWriteUsers &&
                          showEditCustomPerms &&
                          Object.keys(editUserData.custom_permissions).length >
                            0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditUserData({
                                  ...editUserData,
                                  custom_permissions: {},
                                });
                              }}
                              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              Clear All Overrides
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() =>
                            setShowEditCustomPerms(!showEditCustomPerms)
                          }
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            showEditCustomPerms
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-gray-600 border-gray-200 hover:text-navy"
                          }`}
                        >
                          {showEditCustomPerms
                            ? "Hide Controls"
                            : "Edit Overrides"}
                        </button>
                      </div>
                    </div>

                    {showEditCustomPerms && (
                      <div className="mt-3 p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-gray-200 text-[11px] text-gray-500 font-semibold">
                          <span>Backend Section</span>
                          <span>Access Level</span>
                        </div>
                        {PERMISSION_SECTIONS.filter(
                          (sec) => isAdmin || sec.id !== "roles",
                        ).map((sec) => {
                          const roleDefault = (editSelectedRoleObj
                            ?.permissions?.[sec.id] ||
                            "none") as PermissionLevel;
                          const hasOverride =
                            sec.id in editUserData.custom_permissions;
                          const currentVal = hasOverride
                            ? editUserData.custom_permissions[sec.id]
                            : "inherit";

                          return (
                            <div
                              key={sec.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1.5 px-2 bg-white rounded-lg border border-gray-200/60"
                            >
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-500 text-base!">
                                  {sec.icon}
                                </span>
                                <div>
                                  <span className="font-bold text-navy text-xs">
                                    {sec.label}
                                  </span>
                                  <span className="text-[10px] text-gray-400 block">
                                    Role default:{" "}
                                    <strong className="uppercase">
                                      {roleDefault}
                                    </strong>
                                  </span>
                                </div>
                              </div>

                              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-slate-50 text-[11px] shrink-0 self-start sm:self-auto">
                                <button
                                  type="button"
                                  disabled={!canWriteUsers}
                                  onClick={() => {
                                    const updated = {
                                      ...editUserData.custom_permissions,
                                    };
                                    delete updated[sec.id];
                                    setEditUserData({
                                      ...editUserData,
                                      custom_permissions: updated,
                                    });
                                  }}
                                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    !hasOverride
                                      ? "bg-navy text-white shadow-xs"
                                      : "text-gray-600 hover:text-navy"
                                  }`}
                                >
                                  Inherit
                                </button>
                                <button
                                  type="button"
                                  disabled={!canWriteUsers}
                                  onClick={() => {
                                    setEditUserData({
                                      ...editUserData,
                                      custom_permissions: {
                                        ...editUserData.custom_permissions,
                                        [sec.id]: "none",
                                      },
                                    });
                                  }}
                                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    hasOverride && currentVal === "none"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "text-gray-600 hover:text-navy"
                                  }`}
                                >
                                  None
                                </button>
                                <button
                                  type="button"
                                  disabled={!canWriteUsers}
                                  onClick={() => {
                                    setEditUserData({
                                      ...editUserData,
                                      custom_permissions: {
                                        ...editUserData.custom_permissions,
                                        [sec.id]: "read",
                                      },
                                    });
                                  }}
                                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    hasOverride && currentVal === "read"
                                      ? "bg-blue-600 text-white shadow-xs"
                                      : "text-gray-600 hover:text-navy"
                                  }`}
                                >
                                  Read
                                </button>
                                <button
                                  type="button"
                                  disabled={!canWriteUsers}
                                  onClick={() => {
                                    setEditUserData({
                                      ...editUserData,
                                      custom_permissions: {
                                        ...editUserData.custom_permissions,
                                        [sec.id]: "read_write",
                                      },
                                    });
                                  }}
                                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                                    hasOverride && currentVal === "read_write"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-gray-600 hover:text-navy"
                                  }`}
                                >
                                  Read &amp; Write
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </fieldset>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  {canWriteUsers ? "Cancel" : "Close"}
                </button>
                {canWriteUsers && (
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isSubmittingEdit ? (
                      <span className="material-symbols-outlined text-sm! animate-spin">
                        refresh
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-sm!">
                        save
                      </span>
                    )}
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
