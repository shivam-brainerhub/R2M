"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { productsApi, inquiriesApi, quotesApi } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();
  const [productCount, setProductCount] = useState<number | null>(null);
  const [inquiriesCount, setInquiriesCount] = useState<number | null>(null);
  const [quoteCount, setQuoteCount] = useState<number | null>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  useEffect(() => {
    let isMounted = true;
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

    if (token) {
      inquiriesApi
        .getInquiriesStats(token)
        .then((data) => {
          if (isMounted && data) {
            setInquiriesCount(data.total_new);
          }
        })
        .catch((err) => {
          console.error('Failed to load inquiries count:', err);
        });

      quotesApi
        .getQuoteStats(token)
        .then((data) => {
          if (isMounted && data) {
            setQuoteCount(data.new_quotes);
          }
        })
        .catch((err) => {
          console.error('Failed to load quote count:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [token, pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: 'dashboard' },
    { name: 'Users', href: '/admin/users', icon: 'group' },
    {
      name: 'Products',
      href: '/admin/products',
      icon: 'inventory_2',
      badge: productCount !== null ? String(productCount) : undefined,
    },
    {
      name: 'Quote Requests',
      href: '/admin/quotes',
      icon: 'receipt_long',
      badge: quoteCount !== null && quoteCount > 0 ? String(quoteCount) : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      name: 'Inquiries & Leads',
      href: '/admin/inquiries',
      icon: 'contact_mail',
      badge: inquiriesCount !== null && inquiriesCount > 0 ? String(inquiriesCount) : undefined,
      badgeColor: 'bg-emerald-500',
    },
    { name: 'Site Content', href: '/admin/content', icon: 'edit_note' },
    { name: 'Categories & Brands', href: '/admin/categories', icon: 'category' },
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
            className="p-1.5 rounded-lg hover:bg-white/10 text-white focus:outline-none"
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
          className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy text-white flex flex-col transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:h-screen md:shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold text-navy flex items-center justify-center font-black text-sm">
              SA
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide leading-tight">SA Healthcare</div>
              <div className="text-[11px] text-gray-400 font-medium">Administration Portal</div>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl!">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Management
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600/20 text-white shadow-md shadow-blue-900/30'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-xl! ${
                      isActive ? 'text-gold' : 'text-gray-400 group-hover:text-gold transition-colors'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-white/15 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Shortcuts
          </div>
          <Link
            href="/home"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-all group"
          >
            <span className="material-symbols-outlined text-xl! text-gray-400 group-hover:text-gold transition-colors">
              public
            </span>
            <span>View Live Website</span>
            <span className="material-symbols-outlined text-xs! ml-auto text-gray-500">open_in_new</span>
          </Link>
          <Link
            href="/products"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-all group"
          >
            <span className="material-symbols-outlined text-xl! text-gray-400 group-hover:text-gold transition-colors">
              storefront
            </span>
            <span>Live Catalogue</span>
            <span className="material-symbols-outlined text-xs! ml-auto text-gray-500">open_in_new</span>
          </Link>
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-white/10 bg-navy/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 uppercase">
              {user?.full_name ? user.full_name.substring(0, 2) : (user?.username ? user.username.substring(0, 2) : 'AD')}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">{user?.full_name || user?.username || 'Administrator'}</div>
              <div className="text-[10px] text-gray-400 truncate">{user?.email || 'admin@sahealthcare.com'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-lg!">logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex bg-white border-b border-gray-200 px-8 py-3.5 items-center justify-between sticky top-0 z-30 shadow-xs shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span className="material-symbols-outlined text-base! text-gray-400">admin_panel_settings</span>
            <span>Administration</span>
            <span>/</span>
            <span className="text-navy font-semibold capitalize">
              {pathname === '/admin' ? 'Dashboard' : pathname.replace('/admin/', '').replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
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
