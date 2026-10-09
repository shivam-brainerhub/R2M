"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/home' },
    { name: 'Products', href: '/products' },
    { name: 'Manufacturers', href: '/partners' },
    { name: 'Healthcare Sectors', href: '/sectors' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="sticky top-0 left-0 w-full bg-navy text-white px-4 md:px-8 py-3 flex items-center justify-between z-50 shadow-lg border-b border-white/10">
      
      {/* Left: Logo */}
      <Link href="/home" className="flex items-center transition-transform duration-300 hover:scale-105 active:scale-95 shrink-0">
        <Image src="/logo.png" alt="SA Healthcare Logo" width={110} height={40} className="object-contain w-auto h-auto" priority />
      </Link>

      {/* Middle: Desktop Menu */}
      <div className="hidden lg:flex items-center space-x-8 text-sm font-medium">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`relative py-1 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 group ${
                isActive ? 'text-gold' : 'text-white hover:text-gold'
              }`}
            >
              {link.name}
              <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-gold transition-transform duration-300 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
            </Link>
          );
        })}
      </div>

      {/* Right: Desktop Actions & Mobile Hamburger */}
      <div className="flex items-center space-x-4">
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login" className="text-white hover:text-gold transition-all duration-300 hover:-translate-y-0.5 active:scale-95 text-sm font-medium relative group py-1">
            Login
            <span className="absolute left-0 bottom-0 w-full h-[2px] bg-gold transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100"></span>
          </Link>
          <Link href="/contact" className="bg-gold text-navy font-semibold px-5 py-2.5 rounded-full hover:bg-gold-bright transition-all duration-300 hover:scale-[1.02] active:scale-95 text-sm flex items-center gap-1 shadow-md hover:shadow-lg group">
            Request a Quote <span className="material-symbols-outlined text-sm! transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button 
          className="lg:hidden text-white hover:text-gold transition-all duration-300 active:scale-90 p-2 -mr-2 flex items-center justify-center rounded-full hover:bg-white/5 relative w-10 h-10"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className={`material-symbols-outlined text-3xl absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
            menu
          </span>
          <span className={`material-symbols-outlined text-3xl absolute transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
            close
          </span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`absolute top-full left-0 w-full bg-navy border-b border-white/10 shadow-2xl lg:hidden flex flex-col py-6 px-6 space-y-5 max-h-[calc(100vh-80px)] overflow-y-auto transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'opacity-100 translate-y-0 visible' 
            : 'opacity-0 -translate-y-4 invisible pointer-events-none'
        }`}
      >
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setTimeout(() => setIsMobileMenuOpen(false), 150)}
              className={`transition-all duration-300 hover:translate-x-2 active:scale-95 text-lg font-medium block px-4 py-3 -mx-4 rounded-xl active:bg-white/10 ${
                isActive ? 'text-gold bg-white/5' : 'text-white hover:text-gold hover:bg-white/5'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
        
        <div className="h-px w-full bg-white/10 my-2" />
        
        <div className="flex flex-col space-y-3 pt-2">
          <Link href="/login" onClick={() => setTimeout(() => setIsMobileMenuOpen(false), 150)} className="text-white hover:text-gold hover:bg-white/5 transition-all duration-300 hover:translate-x-2 active:scale-95 text-lg font-medium block px-4 py-3 -mx-4 rounded-xl active:bg-white/10">
            Login
          </Link>
          <Link href="/contact" onClick={() => setTimeout(() => setIsMobileMenuOpen(false), 150)} className="bg-gold text-navy font-semibold px-6 py-4 rounded-full hover:bg-gold-bright transition-all duration-300 active:scale-95 text-base flex justify-center items-center gap-2 w-full shadow-lg group mt-2">
            Request a Quote <span className="material-symbols-outlined transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
