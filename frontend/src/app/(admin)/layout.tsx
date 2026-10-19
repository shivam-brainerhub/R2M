"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import { productsApi, inquiriesApi, quotesApi } from '@/lib/api';

const sidebarListeners = new Set<() => void>();
let manualSidebarPreference: boolean | null = null;

function subscribeSidebar(callback: () => void) {
  sidebarListeners.add(callback);
  window.addEventListener('resize', callback);
  return () => {
    sidebarListeners.delete(callback);
    window.removeEventListener('resize', callback);
  };
}

function getSidebarSnapshot(): boolean {
  if (manualSidebarPreference !== null) {
    return manualSidebarPreference;
  }
  try {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    if (saved !== null) {
      manualSidebarPreference = saved === 'true';
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
    localStorage.setItem('admin_sidebar_collapsed', String(next));
  } catch {
    // ignore
  }
  sidebarListeners.forEach((fn) => fn());
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isCollapsed = useSyncExternalStore(subscribeSidebar, getSidebarSnapshot, getServerSidebarSnapshot);
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();
  const [productCount, setProductCount] = useState<number | null>(null);
  const [inquiriesCount, setInquiriesCount] = useState<number | null>(null);
  const [quoteCount, setQuoteCount] = useState<number | null>(null);

  const toggleCollapsed = () => {
    toggleSidebarCollapsed();
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
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
    badge?: string;
    badgeColor?: string;
    showCollapsedBadge?: boolean;
  }

  useEffect(() => {
    let isMounted = true;

    const fetchAllStats = () => {
      productsApi
        .getStats()
        .then((data) => {
          if (isMounted && data) {
            setProductCount(data.total_products);
          }
        })
        .catch((err) => {
          console.error('Failed to load product count:', err);
        });

      const activeToken =
        token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('r2m_access_token') || sessionStorage.getItem('r2m_access_token')
          : null);

      if (activeToken) {
        inquiriesApi
          .getInquiriesStats(activeToken)
          .then((data) => {
            if (isMounted && data) {
              setInquiriesCount(data.total_new);
            }
          })
          .catch((err) => {
            console.error('Failed to load inquiries count:', err);
          });

        quotesApi
          .getQuoteStats(activeToken)
          .then((data) => {
            if (isMounted && data) {
              setQuoteCount(data.new_quotes);
            }
          })
          .catch((err) => {
            console.error('Failed to load quote count:', err);
          });
      }
    };

    fetchAllStats();

    const handleRefresh = () => fetchAllStats();
    if (typeof window !== 'undefined') {
      window.addEventListener('admin:refresh-stats', handleRefresh);
      window.addEventListener('focus', handleRefresh);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('admin:refresh-stats', handleRefresh);
        window.removeEventListener('focus', handleRefresh);
      }
    };
  }, [token, pathname]);

  const navItems: AdminNavItem[] = [
    { name: 'Dashboard', href: '/admin', icon: 'dashboard' },
    { name: 'Users', href: '/admin/users', icon: 'group' },
    { name: 'Categories & Brands', href: '/admin/categories', icon: 'category' },
    {
      name: 'Products',
      href: '/admin/products',
      icon: 'inventory_2',
      badge: productCount !== null ? String(productCount) : undefined,
      showCollapsedBadge: false, // No badge when sidebar is collapsed
    },
    {
      name: 'Quote Requests',
      href: '/admin/quotes',
      icon: 'receipt_long',
      badge: quoteCount !== null && quoteCount > 0 ? String(quoteCount) : undefined,
      badgeColor: 'bg-amber-500',
      showCollapsedBadge: true, // Only shown when there are new quote requests
    },
    {
      name: 'Inquiries & Leads',
      href: '/admin/inquiries',
      icon: 'contact_mail',
      badge: inquiriesCount !== null && inquiriesCount > 0 ? String(inquiriesCount) : undefined,
      badgeColor: 'bg-emerald-500',
      showCollapsedBadge: true,
    },
    { name: 'Site Content', href: '/admin/content', icon: 'edit_note' },
    { name: 'Admin Guide', href: '/admin/guide', icon: 'menu_book' },
  ];


  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-medium">Authenticating admin portal...</p>
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
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-lg text-white">SA Healthcare</span>
            <span className="text-[10px] bg-gold text-navy font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">Admin</span>
          </Link>
        </div>
        <Link href="/home" className="text-xs text-gray-300 hover:text-white flex items-center gap-1">
          <span>Live Site</span>
          <span className="material-symbols-outlined text-sm!">open_in_new</span>
        </Link>
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
          isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        } ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`p-4 border-b border-white/10 flex items-center shrink-0 ${
            isCollapsed ? 'justify-between md:justify-center' : 'justify-between'
          }`}
        >
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0" title="SA Healthcare Administration">
            <div className="w-8 h-8 rounded-lg bg-gold text-navy flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
              SA
            </div>
            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <div className="font-bold text-sm tracking-wide leading-tight truncate">SA Healthcare</div>
                <div className="text-[11px] text-gray-400 font-medium truncate">Administration Portal</div>
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
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                title={item.name}
                className={`flex items-center ${
                  isCollapsed ? 'md:justify-center md:px-2 md:py-3' : 'justify-between px-3 py-2.5'
                } rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-blue-600/20 text-white shadow-md shadow-blue-900/30'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-3'} min-w-0`}>
                  <div className="relative flex items-center justify-center shrink-0">
                    <span
                      className={`material-symbols-outlined text-xl! ${
                        isActive ? 'text-gold' : 'text-gray-400 group-hover:text-gold transition-colors'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {/* Collapsed dot badge on tablet/desktop */}
                    {isCollapsed && item.badge && item.showCollapsedBadge && (
                      <span
                        className={`hidden md:block absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-navy ${
                          item.badgeColor || 'bg-amber-500'
                        }`}
                      />
                    )}
                  </div>
                  {(!isCollapsed || isSidebarOpen) && (
                    <span className={`${isCollapsed ? 'md:hidden' : ''} truncate`}>
                      {item.name}
                    </span>
                  )}
                </div>
                {item.badge && (!isCollapsed || isSidebarOpen) && (
                  <span
                    className={`${isCollapsed ? 'md:hidden' : ''} text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      item.badgeColor || 'bg-white/15 text-white'
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
              isCollapsed ? 'md:justify-center md:px-2 md:py-3' : 'gap-3 px-3 py-2.5'
            } rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-all group`}
          >
            <span className="material-symbols-outlined text-xl! text-gray-400 group-hover:text-gold transition-colors shrink-0">
              public
            </span>
            {(!isCollapsed || isSidebarOpen) && (
              <span className={`${isCollapsed ? 'md:hidden' : ''} truncate`}>
                View Live Website
              </span>
            )}
            {(!isCollapsed || isSidebarOpen) && (
              <span className={`${isCollapsed ? 'md:hidden' : ''} material-symbols-outlined text-xs! ml-auto text-gray-500`}>
                open_in_new
              </span>
            )}
          </Link>
          <Link
            href="/products"
            target="_blank"
            title="Live Catalogue"
            className={`flex items-center ${
              isCollapsed ? 'md:justify-center md:px-2 md:py-3' : 'gap-3 px-3 py-2.5'
            } rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-all group`}
          >
            <span className="material-symbols-outlined text-xl! text-gray-400 group-hover:text-gold transition-colors shrink-0">
              storefront
            </span>
            {(!isCollapsed || isSidebarOpen) && (
              <span className={`${isCollapsed ? 'md:hidden' : ''} truncate`}>
                Live Catalogue
              </span>
            )}
            {(!isCollapsed || isSidebarOpen) && (
              <span className={`${isCollapsed ? 'md:hidden' : ''} material-symbols-outlined text-xs! ml-auto text-gray-500`}>
                open_in_new
              </span>
            )}
          </Link>
        </nav>

        {/* User / Footer */}
        <div
          className={`p-3 border-t border-white/10 bg-navy/50 flex ${
            isCollapsed ? 'md:flex-col md:items-center md:gap-2 justify-between' : 'items-center justify-between'
          } shrink-0`}
        >
          <div className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-3'} min-w-0`}>
            <div
              className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 uppercase shadow-xs"
              title={user?.full_name || user?.username || 'Administrator'}
            >
              {user?.full_name ? user.full_name.substring(0, 2) : (user?.username ? user.username.substring(0, 2) : 'AD')}
            </div>
            {(!isCollapsed || isSidebarOpen) && (
              <div className={`${isCollapsed ? 'md:hidden' : ''} truncate min-w-0`}>
                <div className="text-xs font-semibold text-white truncate">{user?.full_name || user?.username || 'Administrator'}</div>
                <div className="text-[10px] text-gray-400 truncate">{user?.email || 'admin@sahealthcare.com'}</div>
              </div>
            )}
          </div>
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
                {isCollapsed ? 'menu' : 'menu_open'}
              </span>
            </button>
            <span className="material-symbols-outlined text-base! text-gray-400">admin_panel_settings</span>
            <span>Administration</span>
            <span>/</span>
            <span className="text-navy font-semibold capitalize">
              {pathname === '/admin' ? 'Dashboard' : pathname.replace('/admin/', '').replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/products?action=new"
              className="inline-flex items-center gap-1.5 bg-navy text-white text-xs font-semibold px-3.5 py-1.5 rounded-full hover:bg-navy-light transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-sm!">add</span>
              Add Product
            </Link>

            <Link
              href="/home"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-navy bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
            >
              <span>View Site</span>
              <span className="material-symbols-outlined text-xs!">open_in_new</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
