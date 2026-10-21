"use client";

import { useAuth } from "@/context/AuthContext";
import { inquiriesApi, productsApi, quotesApi } from "@/lib/api";
import { getUserInitials } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

const sidebarListeners = new Set<() => void>();
let manualSidebarPreference: boolean | null = null;

function subscribeSidebar(callback: () => void) {
  sidebarListeners.add(callback);
  window.addEventListener("resize", callback);
  return () => {
    sidebarListeners.delete(callback);
    window.removeEventListener("resize", callback);
  };
}

function getSidebarSnapshot(): boolean {
  if (manualSidebarPreference !== null) {
    return manualSidebarPreference;
  }
  try {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved !== null) {
      manualSidebarPreference = saved === "true";
      return manualSidebarPreference;
    }
    return window.innerWidth < 1024;
  } catch {
    return false;
  }
}

function getServerSidebarSnapshot(): boolean {
  return false;
}

function toggleSidebarCollapsed() {
  const current = getSidebarSnapshot();
  const next = !current;
  manualSidebarPreference = next;
  try {
    localStorage.setItem("admin_sidebar_collapsed", String(next));
  } catch {
    // ignore
  }
  sidebarListeners.forEach((fn) => fn());
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getServerSidebarSnapshot,
  );
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    isAdmin,
    hasPermission,
    logout,
  } = useAuth();
  const [productCount, setProductCount] = useState<number | null>(null);
  const [inquiriesCount, setInquiriesCount] = useState<number | null>(null);
  const [quoteCount, setQuoteCount] = useState<number | null>(null);

  const toggleCollapsed = () => {
    toggleSidebarCollapsed();
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  interface AdminNavItem {
    name: string;
    href: string;
    icon: string;
    section?: string;
    adminOnly?: boolean;
    badge?: string;
    badgeColor?: string;
    showCollapsedBadge?: boolean;
  }

  useEffect(() => {
    if (isLoading || !token) return;

    let isMounted = true;

    const canReadProducts = isAdmin || hasPermission("products", "read");
    const canReadInquiries = isAdmin || hasPermission("inquiries", "read");
    const canReadQuotes = isAdmin || hasPermission("quotes", "read");

    const fetchAllStats = () => {
      if (canReadProducts) {
        productsApi
          .getStats()
          .then((data) => {
            if (isMounted && data) {
              setProductCount(data.total_products);
            }
          })
          .catch((err) => {
            console.error("Failed to load product count:", err);
          });
      }

      if (canReadInquiries) {
        inquiriesApi
          .getInquiriesStats(token)
          .then((data) => {
            if (isMounted && data) {
              setInquiriesCount(data.total_new);
            }
          })
          .catch((err) => {
            console.error("Failed to load inquiries count:", err);
          });
      }

      if (canReadQuotes) {
        quotesApi
          .getQuoteStats(token)
          .then((data) => {
            if (isMounted && data) {
              setQuoteCount(data.new_quotes);
            }
          })
          .catch((err) => {
            console.error("Failed to load quote count:", err);
          });
      }
    };

    fetchAllStats();

    const handleRefresh = () => fetchAllStats();
    if (typeof window !== "undefined") {
      window.addEventListener("admin:refresh-stats", handleRefresh);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("admin:refresh-stats", handleRefresh);
      }
    };
  }, [isLoading, token, isAdmin, hasPermission]);

  const navItems: AdminNavItem[] = [
    { name: "Dashboard", href: "/portal", icon: "dashboard" },
    {
      name: "Quote Requests",
      href: "/portal/quotes",
      icon: "receipt_long",
      section: "quotes",
      badge:
        quoteCount !== null && quoteCount > 0 ? String(quoteCount) : undefined,
      badgeColor: "bg-amber-500",
      showCollapsedBadge: true, // Only shown when there are new quote requests
    },
    {
      name: "Products",
      href: "/portal/products",
      icon: "inventory_2",
      section: "products",
      badge: productCount !== null ? String(productCount) : undefined,
      showCollapsedBadge: false, // No badge when sidebar is collapsed
    },
    {
      name: "Categories & Brands",
      href: "/portal/categories",
      icon: "category",
      section: "categories",
    },
    {
      name: "Inquiries & Leads",
      href: "/portal/inquiries",
      icon: "contact_mail",
      section: "inquiries",
      badge:
        inquiriesCount !== null && inquiriesCount > 0
          ? String(inquiriesCount)
          : undefined,
      badgeColor: "bg-emerald-500",
      showCollapsedBadge: true,
    },
    {
      name: "Site Content",
      href: "/portal/content",
      icon: "edit_note",
      section: "content",
    },
    { name: "Users", href: "/portal/users", icon: "group", section: "users" },
    {
      name: "Roles & Permissions",
      href: "/portal/roles",
      icon: "admin_panel_settings",
      section: "roles",
      adminOnly: true,
    },
    {
      name: isAdmin ? "Admin Guide" : "Staff Guide",
      href: "/portal/guide",
      icon: "menu_book",
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    if (!item.section) return true;
    return hasPermission(item.section, "read");
  });

  const getRequiredSectionForPath = (
    path: string,
  ): {
    section: string;
    level: "read" | "write";
    adminOnly?: boolean;
  } | null => {
    if (path.startsWith("/portal/roles") || path.startsWith("/admin/roles"))
      return { section: "roles", level: "read", adminOnly: true };
    if (path.startsWith("/portal/users") || path.startsWith("/admin/users"))
      return { section: "users", level: "read" };
    if (
      path.startsWith("/portal/products") ||
      path.startsWith("/admin/products")
    )
      return { section: "products", level: "read" };
    if (
      path.startsWith("/portal/categories") ||
      path.startsWith("/admin/categories")
    )
      return { section: "categories", level: "read" };
    if (path.startsWith("/portal/quotes") || path.startsWith("/admin/quotes"))
      return { section: "quotes", level: "read" };
    if (
      path.startsWith("/portal/inquiries") ||
      path.startsWith("/admin/inquiries")
    )
      return { section: "inquiries", level: "read" };
    if (path.startsWith("/portal/content") || path.startsWith("/admin/content"))
      return { section: "content", level: "read" };
    return null;
  };

  const reqCheck = getRequiredSectionForPath(pathname);
  const isAccessDenied = reqCheck
    ? (reqCheck.adminOnly && !isAdmin) ||
      !hasPermission(reqCheck.section, reqCheck.level)
    : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">
            Authenticating admin portal...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-gray-800 overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden bg-navy text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white focus:outline-none cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <span className="material-symbols-outlined text-2xl!">menu</span>
          </button>
          <Link href="/portal" className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-lg text-white">
              SA Healthcare
            </span>
            <span className="text-[10px] bg-gold text-navy font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
              {user?.role_name || (isAdmin ? "Admin" : "Staff")}
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/portal/profile"
            className="w-7 h-7 rounded-full bg-gold text-navy font-bold text-xs flex items-center justify-center uppercase shrink-0"
            title="My Profile"
          >
            {getUserInitials(user?.full_name, user?.username)}
          </Link>
          <Link
            href="/home"
            className="text-xs text-gray-300 hover:text-white flex items-center gap-1"
          >
            <span>Live Site</span>
            <span className="material-symbols-outlined text-sm!">
              open_in_new
            </span>
          </Link>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-xs cursor-pointer"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-navy text-white flex flex-col transform transition-all duration-300 ease-in-out md:static md:translate-x-0 md:h-screen md:shrink-0 ${
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full"
        } ${isCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        {/* Brand Header */}
        <div
          className={`p-4 border-b border-white/10 flex items-center shrink-0 ${
            isCollapsed
              ? "justify-between md:justify-center"
              : "justify-between"
          }`}
        >
          <Link
            href="/portal"
            className="flex items-center gap-2.5 min-w-0"
            title={
              isAdmin
                ? "SA Healthcare Administration"
                : "SA Healthcare Staff Portal"
            }
          >
            <div className="w-8 h-8 rounded-lg bg-gold text-navy flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
              SA
            </div>
            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <div className="font-bold text-sm tracking-wide leading-tight truncate">
                  SA Healthcare
                </div>
                <div className="text-[11px] text-gray-400 font-medium truncate">
                  {user?.role_name
                    ? `${user.role_name} Portal`
                    : isAdmin
                      ? "Administration Portal"
                      : "Staff Portal"}
                </div>
              </div>
            )}
          </Link>
          {/* Mobile close button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white cursor-pointer p-1"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined text-xl!">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {!isCollapsed ? (
            <div className="px-3 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
              Management
            </div>
          ) : (
            <div className="h-2" />
          )}
          {visibleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                title={item.name}
                className={`flex items-center ${
                  isCollapsed
                    ? "md:justify-center md:px-2 md:py-3"
                    : "justify-between px-3 py-2.5"
                } rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? "bg-blue-600/20 text-white shadow-md shadow-blue-900/30"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div
                  className={`flex items-center ${
                    isCollapsed ? "md:justify-center" : "gap-3"
                  } min-w-0`}
                >
                  <div className="relative flex items-center justify-center shrink-0">
                    <span
                      className={`material-symbols-outlined text-xl! ${
                        isActive
                          ? "text-gold"
                          : "text-gray-400 group-hover:text-gold transition-colors"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {/* Collapsed dot badge on tablet/desktop */}
                    {isCollapsed && item.badge && item.showCollapsedBadge && (
                      <span
                        className={`hidden md:block absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-navy ${
                          item.badgeColor || "bg-amber-500"
                        }`}
                      />
                    )}
                  </div>
                  {(!isCollapsed || isSidebarOpen) && (
                    <span
                      className={`${isCollapsed ? "md:hidden" : ""} truncate`}
                    >
                      {item.name}
                    </span>
                  )}
                </div>
                {item.badge && (!isCollapsed || isSidebarOpen) && (
                  <span
                    className={`${
                      isCollapsed ? "md:hidden" : ""
                    } text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      item.badgeColor || "bg-white/15 text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {!isCollapsed ? (
            <div className="pt-6 px-3 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
              Shortcuts
            </div>
          ) : (
            <div className="h-px bg-white/10 my-3 mx-2" />
          )}

          <Link
            href="/home"
            target="_blank"
            title="View Live Website"
            className={`flex items-center ${
              isCollapsed
                ? "md:justify-center md:px-2 md:py-3"
                : "gap-3 px-3 py-2.5"
            } rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-all group`}
          >
            <span className="material-symbols-outlined text-xl! text-gray-400 group-hover:text-gold transition-colors shrink-0">
              public
            </span>
            {(!isCollapsed || isSidebarOpen) && (
              <span className={`${isCollapsed ? "md:hidden" : ""} truncate`}>
                View Live Website
              </span>
            )}
            {(!isCollapsed || isSidebarOpen) && (
              <span
                className={`${
                  isCollapsed ? "md:hidden" : ""
                } material-symbols-outlined text-xs! ml-auto text-gray-500`}
              >
                open_in_new
              </span>
            )}
          </Link>
          <Link
            href="/products"
            target="_blank"
            title="Live Catalogue"
            className={`flex items-center ${
              isCollapsed
                ? "md:justify-center md:px-2 md:py-3"
                : "gap-3 px-3 py-2.5"
            } rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-all group`}
          >
            <span className="material-symbols-outlined text-xl! text-gray-400 group-hover:text-gold transition-colors shrink-0">
              storefront
            </span>
            {(!isCollapsed || isSidebarOpen) && (
              <span className={`${isCollapsed ? "md:hidden" : ""} truncate`}>
                Live Catalogue
              </span>
            )}
            {(!isCollapsed || isSidebarOpen) && (
              <span
                className={`${
                  isCollapsed ? "md:hidden" : ""
                } material-symbols-outlined text-xs! ml-auto text-gray-500`}
              >
                open_in_new
              </span>
            )}
          </Link>
        </nav>

        {/* User / Footer */}
        <div
          className={`p-3 border-t border-white/10 bg-navy/50 flex ${
            isCollapsed
              ? "md:flex-col md:items-center md:gap-2 justify-between"
              : "items-center justify-between"
          } shrink-0`}
        >
          <Link
            href="/portal/profile"
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center ${
              isCollapsed ? "md:justify-center p-1" : "gap-3 p-1.5"
            } min-w-0 rounded-xl transition-all ${
              pathname === "/portal/profile"
                ? "bg-blue-600/30 ring-1 ring-gold/50 shadow-xs"
                : "hover:bg-white/5"
            }`}
            title="Manage My Profile & Password"
          >
            <div
              className={`w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 uppercase shadow-xs transition-all ${
                pathname === "/portal/profile"
                  ? "ring-2 ring-gold"
                  : "group-hover:ring-2 group-hover:ring-gold"
              }`}
            >
              {getUserInitials(user?.full_name, user?.username)}
            </div>
            {(!isCollapsed || isSidebarOpen) && (
              <div
                className={`${
                  isCollapsed ? "md:hidden" : ""
                } truncate min-w-0 text-left`}
              >
                <div
                  className={`text-xs font-semibold truncate transition-colors ${
                    pathname === "/portal/profile" ? "text-gold" : "text-white"
                  }`}
                >
                  {user?.full_name || user?.username || "Staff User"}
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  <span className="truncate">
                    {user?.role_name || (isAdmin ? "Administrator" : "Staff")}
                  </span>
                </div>
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg!">logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Desktop / Tablet Top Header Bar */}
        <header className="hidden md:flex bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 items-center justify-between sticky top-0 z-30 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
            <button
              onClick={toggleCollapsed}
              className="p-1.5 -ml-1 rounded-lg text-gray-600 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center border border-gray-200/80 shadow-2xs"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="material-symbols-outlined text-xl! text-navy">
                {isCollapsed ? "menu" : "menu_open"}
              </span>
            </button>
            <span className="material-symbols-outlined text-base! text-gray-400">
              {isAdmin ? "admin_panel_settings" : "shield_person"}
            </span>
            <span>{isAdmin ? "Administration" : "Portal"}</span>
            <span>/</span>
            <span className="text-navy font-semibold capitalize">
              {pathname === "/portal"
                ? "Dashboard"
                : pathname
                    .replace("/portal/", "")
                    .replace("/admin/", "")
                    .replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission("products", "write") && (
              <Link
                href="/portal/products?action=new"
                className="inline-flex items-center gap-1.5 bg-navy text-white text-xs font-semibold px-3.5 py-1.5 rounded-full hover:bg-navy-light transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-sm!">add</span>
                Add Product
              </Link>
            )}

            <Link
              href="/home"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-navy bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
            >
              <span>View Site</span>
              <span className="material-symbols-outlined text-xs!">
                open_in_new
              </span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {isAccessDenied ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-100 shadow-sm p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl!">
                  lock
                </span>
              </div>
              <h2 className="text-lg font-bold text-navy mb-2">
                Access Restricted
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Your staff account (
                <span className="font-semibold text-gray-700">
                  {user?.role_name || user?.role}
                </span>
                ) does not have permission to view or manage this module. If you
                require access, please contact your platform administrator.
              </p>
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 bg-navy text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-navy-light transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-base!">
                  arrow_back
                </span>
                Return to Dashboard
              </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
