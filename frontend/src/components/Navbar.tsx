"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/home' },
    { name: 'Products', href: '/products' },
    { name: 'Manufacturers', href: '/partners' },
    { name: 'Healthcare Sectors', href: '/sectors' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="sticky top-0 left-0 w-full bg-navy text-white px-6 py-2 flex items-center justify-between z-50 shadow-md border-b border-white/10">
      <div className="flex items-center space-x-12">
        <Link href="/home" className="flex items-center">
          <Image src="/logo.png" alt="SA Healthcare Logo" width={100} height={50} className="object-contain w-auto h-auto" priority />
        </Link>
        <div className="hidden md:flex space-x-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors ${
                  isActive
                    ? 'text-gold border-b-2 border-gold pb-1'
                    : 'hover:text-gold border-b-2 border-transparent pb-1'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <button className="text-white hover:text-gold transition-colors">
          <span className="material-symbols-outlined">search</span>
        </button>
        <Link href="/login" className="text-white hover:text-gold transition-colors text-sm font-medium">
          Login
        </Link>
        <Link href="/contact" className="bg-gold text-navy font-semibold px-5 py-2 rounded-full hover:bg-gold-bright transition-colors text-sm flex items-center gap-1">
          Request a Quote <span className="material-symbols-outlined text-sm!">arrow_forward</span>
        </Link>
      </div>
    </nav>
  );
}
