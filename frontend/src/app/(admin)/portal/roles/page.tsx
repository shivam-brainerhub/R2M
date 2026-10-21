"use client";

import { useAuth } from "@/context/AuthContext";
import {
  adminRolesApi,
  ApiError,
  PermissionLevel,
  PermissionSection,
  Role,
} from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const SECTIONS_CONFIG: {
  key: PermissionSection;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    key: "quotes",
    label: "Quote Requests (RFQ)",
    icon: "receipt_long",
    description:
      "Incoming client quote requests, pricing entries, and workflow statuses",
  },
  {
    key: "products",
    label: "Products & Documents",
    icon: "inventory_2",
    description:
      "Catalogue devices, clinical specifications, and manufacturer brochures",
  },
  {
    key: "categories",
    label: "Categories & Brands",
    icon: "category",
    description:
      "Clinical categories, subcategories, manufacturer brands, and dynamic properties",
  },
  {
    key: "inquiries",
    label: "Inquiries & Leads",
    icon: "contact_mail",
    description: "Contact form messages and prospective supplier applications",
  },
  {
    key: "content",
    label: "Site Content (CMS)",
    icon: "edit_note",
    description:
      "Homepage hero, company profile, banner highlights, and legal pages",
  },
  {
    key: "users",
    label: "User IAM & Staff Accounts",
    icon: "group",
    description:
      "Platform user accounts, staff credentials, password resets, and status",
  },
];

export default function AdminRolesPage() {
  const { token } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permissions: Record<PermissionSection, PermissionLevel>;
  }>({
    name: "",
    description: "",
    permissions: {
      quotes: "none",
      products: "none",
      categories: "none",
      inquiries: "none",
      content: "none",
      users: "none",
      roles: "none",
    },
  });

  // Notification Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRoles = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRolesApi.listRoles(token);
      setRoles(data);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to load roles";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Lock background screen scroll when any role modal is open
  const isAnyRoleModalOpen =
    createModalOpen || Boolean(editRole) || Boolean(deleteRole);

  useEffect(() => {
    if (isAnyRoleModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAnyRoleModalOpen]);

  const stats = useMemo(() => {
    const total = roles.length;
    const system = roles.filter((r) => r.is_system).length;
    const custom = roles.filter((r) => !r.is_system).length;
    const totalAssignedUsers = roles.reduce(
      (acc, r) => acc + (r.user_count || 0),
      0,
    );
    return { total, system, custom, totalAssignedUsers };
  }, [roles]);

  const openCreateModal = () => {
    setFormData({
      name: "",
      description: "",
      permissions: {
        quotes: "none",
        products: "none",
        categories: "none",
        inquiries: "none",
        content: "none",
        users: "none",
        roles: "none",
      },
    });
    setFormError(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: {
        quotes: role.permissions?.quotes || "none",
        products: role.permissions?.products || "none",
        categories: role.permissions?.categories || "none",
        inquiries: role.permissions?.inquiries || "none",
        content: role.permissions?.content || "none",
        users: role.permissions?.users || "none",
        roles: role.permissions?.roles || "none",
      },
    });
    setFormError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!formData.name.trim()) {
      setFormError("Role name is required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await adminRolesApi.createRole(token, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        permissions: formData.permissions,
      });
      showToast(
        `Role "${formData.name.trim()}" created successfully`,
        "success",
      );
      setCreateModalOpen(false);
      fetchRoles();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to create role",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editRole) return;
    if (!formData.name.trim()) {
      setFormError("Role name is required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await adminRolesApi.updateRole(token, editRole.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        permissions: formData.permissions,
      });
      showToast(
        `Role "${formData.name.trim()}" updated successfully`,
        "success",
      );
      setEditRole(null);
      fetchRoles();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to update role",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!token || !deleteRole) return;
    setIsSubmitting(true);
    try {
      await adminRolesApi.deleteRole(token, deleteRole.id);
      showToast(`Role "${deleteRole.name}" deleted successfully`, "success");
      setDeleteRole(null);
      fetchRoles();
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Failed to delete role",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const setSectionPermission = (
    section: PermissionSection,
    level: PermissionLevel,
  ) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [section]: level,
      },
    }));
  };

  const renderBadge = (level?: PermissionLevel) => {
    switch (level) {
      case "read_write":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Read + Write
          </span>
        );
      case "read":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full border border-sky-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Read Only
          </span>
        );
      case "none":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
            None
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm animate-fade-in ${
            toast.type === "success"
              ? "bg-emerald-900/90 text-white border-emerald-700"
              : "bg-rose-900/90 text-white border-rose-700"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-navy text-2xl!">
              admin_panel_settings
            </span>
            <h1 className="text-xl font-bold text-navy tracking-tight">
              Roles & Granular Permissions
            </h1>
            <span className="text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-300/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Define specialized staff roles, configure read/write permissions per
            section, and group access capabilities cleanly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-base!">group</span>
            Manage Users
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-navy text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-navy-light transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base!">add</span>
            Create Custom Role
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-navy flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl!">
              shield_person
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">{stats.total}</div>
            <div className="text-xs text-gray-500 font-medium">
              Total Platform Roles
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl!">
              verified_user
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">{stats.system}</div>
            <div className="text-xs text-gray-500 font-medium">
              Built-in System Roles
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl!">tune</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">{stats.custom}</div>
            <div className="text-xs text-gray-500 font-medium">
              Custom User Levels
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl!">group</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">
              {stats.totalAssignedUsers}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              Users with Assigned Roles
            </div>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-navy">
              Configured Roles & Permission Matrix
            </h2>
            <p className="text-xs text-gray-400">
              Click on any role to edit permissions or inspect assigned access
            </p>
          </div>
          <button
            onClick={fetchRoles}
            className="text-xs text-gray-500 hover:text-navy flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base!">
              refresh
            </span>
            <span>Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500">
              Loading roles and permission settings...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <span className="material-symbols-outlined text-3xl mb-2">
              error
            </span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {roles.map((role) => {
              const isAdminRole = role.slug?.toLowerCase() === "admin";
              const isCustomerRole = role.slug?.toLowerCase() === "user";
              return (
                <div
                  key={role.id}
                  className="p-5 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isAdminRole
                            ? "bg-navy text-gold"
                            : isCustomerRole
                              ? "bg-slate-100 text-slate-600"
                              : "bg-blue-50 text-navy"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl!">
                          {isAdminRole
                            ? "military_tech"
                            : isCustomerRole
                              ? "person"
                              : "badge"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-bold text-navy">
                            {role.name}
                          </h3>
                          <span className="text-[11px] font-mono text-gray-400">
                            ({role.slug})
                          </span>
                          {role.is_system ? (
                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                              Built-in System
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                              Custom Level
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {role.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-gray-200">
                        <span className="material-symbols-outlined text-sm!">
                          group
                        </span>
                        <span className="font-semibold text-navy">
                          {role.user_count || 0}
                        </span>
                        <span>
                          user{(role.user_count || 0) === 1 ? "" : "s"} assigned
                        </span>
                      </div>

                      <button
                        onClick={() => openEditModal(role)}
                        disabled={isAdminRole}
                        title={
                          isAdminRole
                            ? "Administrator role permissions are permanently set to full access"
                            : "Edit role permissions"
                        }
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                          isAdminRole
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                            : "bg-white hover:bg-slate-100 text-navy border border-gray-200 cursor-pointer shadow-2xs"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm!">
                          edit
                        </span>
                        Edit Role
                      </button>

                      {!role.is_system && (
                        <button
                          onClick={() => setDeleteRole(role)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-gray-200 hover:border-rose-200 transition-colors cursor-pointer shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-sm!">
                            delete
                          </span>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section Permissions Chips Matrix */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-gray-200/70">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Section Access Breakdown
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {SECTIONS_CONFIG.map((sec) => {
                        const level = isAdminRole
                          ? "read_write"
                          : (role.permissions?.[sec.key] as PermissionLevel) ||
                            "none";
                        return (
                          <div
                            key={sec.key}
                            className="bg-white p-2 rounded-lg border border-gray-200/80 flex flex-col justify-between gap-1.5"
                          >
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-700 truncate">
                              <span className="material-symbols-outlined text-sm! text-gray-400">
                                {sec.icon}
                              </span>
                              <span className="truncate">
                                {sec.label.split(" ")[0]}
                              </span>
                            </div>
                            <div>{renderBadge(level)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Role */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 my-8 overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-navy text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl!">
                    add_moderator
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">
                    Create New Custom Role
                  </h3>
                  <p className="text-xs text-gray-500">
                    Configure role details and fine-tune section permissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-navy p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl!">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Role Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Representative, Product Specialist, Procurement Lead"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Role Description
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of what staff with this user level are responsible for"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
                  />
                </div>
              </div>

              {/* Section Permissions Matrix Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                    Section Permissions
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Choose access level for each module
                  </span>
                </div>

                <div className="space-y-3">
                  {SECTIONS_CONFIG.map((sec) => {
                    const currentLevel = formData.permissions[sec.key];
                    return (
                      <div
                        key={sec.key}
                        className="p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-navy text-lg! mt-0.5">
                            {sec.icon}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-navy">
                              {sec.label}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {sec.description}
                            </div>
                          </div>
                        </div>

                        {/* Segmented Control */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSectionPermission(sec.key, "none")
                            }
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                              currentLevel === "none"
                                ? "bg-white text-gray-700 shadow-xs"
                                : "text-gray-400 hover:text-gray-700"
                            }`}
                          >
                            None
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSectionPermission(sec.key, "read")
                            }
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                              currentLevel === "read"
                                ? "bg-sky-600 text-white shadow-xs"
                                : "text-gray-500 hover:text-sky-700"
                            }`}
                          >
                            Read Only
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSectionPermission(sec.key, "read_write")
                            }
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                              currentLevel === "read_write"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-gray-500 hover:text-emerald-700"
                            }`}
                          >
                            Read + Write
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-navy text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-light transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Save New Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Role */}
      {editRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 my-8 overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-navy text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl!">
                    edit
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">
                    Edit Role: {editRole.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Update role title, description, or adjust permission access
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditRole(null)}
                className="text-gray-400 hover:text-navy p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl!">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    error
                  </span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Role Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Role Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
                  />
                </div>
              </div>

              {/* Section Permissions Matrix Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                    Section Permissions
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Choose access level for each module
                  </span>
                </div>

                <div className="space-y-3">
                  {SECTIONS_CONFIG.map((sec) => {
                    const currentLevel = formData.permissions[sec.key];
                    return (
                      <div
                        key={sec.key}
                        className="p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-navy text-lg! mt-0.5">
                            {sec.icon}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-navy">
                              {sec.label}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {sec.description}
                            </div>
                          </div>
                        </div>

                        {/* Segmented Control */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSectionPermission(sec.key, "none")
                            }
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                              currentLevel === "none"
                                ? "bg-white text-gray-700 shadow-xs"
                                : "text-gray-400 hover:text-gray-700"
                            }`}
                          >
                            None
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSectionPermission(sec.key, "read")
                            }
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                              currentLevel === "read"
                                ? "bg-sky-600 text-white shadow-xs"
                                : "text-gray-500 hover:text-sky-700"
                            }`}
                          >
                            Read Only
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSectionPermission(sec.key, "read_write")
                            }
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                              currentLevel === "read_write"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-gray-500 hover:text-emerald-700"
                            }`}
                          >
                            Read + Write
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditRole(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-navy text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-light transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-scale-in">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl!">
                warning
              </span>
            </div>
            <h3 className="text-base font-bold text-navy mb-2">
              Delete Role &quot;{deleteRole.name}&quot;?
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Are you sure you want to delete this custom role? This action is
              permanent. You cannot delete a role if staff users are currently
              assigned to it.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteRole(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteSubmit}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
