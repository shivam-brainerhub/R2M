"use client";

import Link from 'next/link';
import Image from 'next/image';

export default function AdminDashboardPage() {
  const stats = [
    { title: 'Total Products', value: '4', change: '+2 in review', icon: 'inventory_2', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pending Quotes', value: '3', change: 'Requires response', icon: 'receipt_long', color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Active Brands', value: '6', change: 'Mindray, Philips...', icon: 'domain', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const recentQuotes = [
    {
      id: 'QR-2041',
      facility: 'Mediclinic Panorama',
      contact: 'Dr. Johan van der Merwe',
      items: 'BeneVision N12 (x4), IntelliVue MX450 (x2)',
      date: 'Today, 09:45 AM',
      status: 'New',
      statusClass: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'QR-2040',
      facility: 'Netcare St Augustine\'s',
      contact: 'Sister Nomsa Dlamini',
      items: 'Infinity M300 (x6)',
      date: 'Yesterday, 16:20 PM',
      status: 'Under Review',
      statusClass: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'QR-2039',
      facility: 'Life Westville Hospital',
      contact: 'Procurement: Kevin Pillay',
      items: 'CMS8000 (x10), BeneVision N12 (x2)',
      date: '10 Oct 2026',
      status: 'Quoted',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  ];

  const topProducts = [
    { id: '1', name: 'BeneVision N12', brand: 'Mindray', views: 842, quotes: 18, image: '/images/benevision_n12.jpg' },
    { id: '2', name: 'IntelliVue MX450', brand: 'Philips', views: 710, quotes: 14, image: '/images/intellivue_mx450.jpg' },
    { id: '3', name: 'Infinity M300', brand: 'Dräger', views: 564, quotes: 9, image: '/images/infinity_m300.jpg' },
    { id: '4', name: 'CMS8000', brand: 'Contec', views: 490, quotes: 12, image: '/images/contec_cms8000.jpg' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="bg-navy rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-gold/30">
              <span className="w-2 h-2 rounded-full bg-gold"></span>
              Admin Control Centre
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back to SA Healthcare CMS
            </h1>
            <p className="text-gray-300 text-sm sm:text-base mt-1 max-w-xl font-light">
              Manage medical products, handle clinical quote requests, update homepage banners and maintain partner manufacturers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/products"
              className="bg-gold text-navy font-bold px-4 py-2.5 rounded-xl hover:bg-gold-bright transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-1.5 shadow-md"
            >
              <span className="material-symbols-outlined text-lg!">add_circle</span>
              Manage Products
            </Link>
            <Link
              href="/admin/quotes"
              className="bg-white/10 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-white/20 transition-all border border-white/15 text-xs sm:text-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg!">receipt_long</span>
              View Quotes ({stats[1].value})
            </Link>
          </div>
        </div>

        {/* Decorative corner shape */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
              <p className="text-2xl sm:text-3xl font-black text-navy mt-1">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs! text-emerald-600">trending_up</span>
                {stat.change}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shrink-0`}>
              <span className="material-symbols-outlined text-2xl!">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Recent Quotes & Catalogue Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Recent Quote Inquiries */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-navy text-base sm:text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-xl!">notifications_active</span>
                Recent Quote Requests
              </h2>
              <p className="text-xs text-gray-500">Incoming healthcare requests requiring sales quote responses.</p>
            </div>
            <Link
              href="/admin/quotes"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>See All</span>
              <span className="material-symbols-outlined text-sm!">arrow_forward</span>
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-gray-500 uppercase text-[11px] font-bold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3">Quote ID &amp; Facility</th>
                  <th className="px-4 py-3">Requested Items</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-navy">{q.facility}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">{q.id} &bull; {q.contact}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 max-w-xs truncate" title={q.items}>
                      {q.items}
                    </td>
                    <td className="px-4 py-4 text-gray-500 whitespace-nowrap text-xs">
                      {q.date}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${q.statusClass}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/quotes?id=${q.id}`}
                        className="text-xs font-semibold text-navy bg-slate-100 hover:bg-gold hover:text-navy px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1"
                      >
                        Respond
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Catalogue Summary & Quick Links */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h2 className="font-bold text-navy text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-xl!">inventory</span>
                Live Products
              </h2>
              <Link href="/admin/products" className="text-xs font-semibold text-blue-600 hover:underline">
                Manage (4)
              </Link>
            </div>

            <div className="space-y-3">
              {topProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 relative overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-navy truncate">{p.name}</div>
                      <div className="text-[11px] text-gray-400 uppercase font-semibold">{p.brand}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Management Portals
            </h3>
            <Link
              href="/admin/content"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base! text-gray-500">edit_note</span>
                <span>Edit Site Content &amp; Hero Banner</span>
              </div>
              <span className="material-symbols-outlined text-xs! text-gray-400">chevron_right</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base! text-gray-500">group</span>
                <span>User Accounts &amp; Permissions</span>
              </div>
              <span className="material-symbols-outlined text-xs! text-gray-400">chevron_right</span>
            </Link>
            <Link
              href="/admin/categories"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-navy transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base! text-gray-500">category</span>
                <span>Categories &amp; Manufacturers</span>
              </div>
              <span className="material-symbols-outlined text-xs! text-gray-400">chevron_right</span>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
