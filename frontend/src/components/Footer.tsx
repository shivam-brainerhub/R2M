"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { contentApi, CompanyContent } from '@/lib/api';
import { DEFAULT_COMPANY } from '@/lib/constants';

export default function Footer() {
  const [company, setCompany] = useState<CompanyContent>(DEFAULT_COMPANY);

  useEffect(() => {
    contentApi
      .getAll()
      .then((data) => {
        if (data.company) {
          setCompany((prev) => ({
            ...prev,
            companyName: data.company.companyName || data.company.company_name || prev.companyName,
            phone: data.company.phone || prev.phone,
            email: data.company.email || prev.email,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-navy text-white py-12 px-6 print:hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <div className="flex items-center space-x-2 mb-4">
            <div className="text-gold font-bold text-3xl italic tracking-tighter">SAH</div>
            <div className="text-xs font-semibold leading-tight uppercase">
              {company.companyName ? company.companyName.replace(/\s+/g, '\n') : 'SA\nHEALTHCARE'}
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <Link
              href="/contact"
              className="text-gray-300 hover:text-gold transition-all duration-300 hover:scale-110 active:scale-90"
              title="Global Office"
            >
              <span className="material-symbols-outlined">language</span>
            </Link>
            <a
              href={`mailto:${company.email || 'info@sahealthcare.com'}`}
              className="text-gray-300 hover:text-gold transition-all duration-300 hover:scale-110 active:scale-90"
              title={`Email ${company.email || 'SA Healthcare'}`}
            >
              <span className="material-symbols-outlined">mail</span>
            </a>
            {company.phone && (
              <a
                href={`tel:${company.phone.replace(/\s+/g, '')}`}
                className="text-gray-300 hover:text-gold transition-all duration-300 hover:scale-110 active:scale-90"
                title={`Call ${company.phone}`}
              >
                <span className="material-symbols-outlined">call</span>
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-gold">Products</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/products" className="hover:text-gold transition-colors duration-200">Browse All Products</Link></li>
            <li><Link href="/products" className="hover:text-white transition-colors duration-200">Product Categories</Link></li>
            <li><Link href="/products" className="hover:text-white transition-colors duration-200">Search</Link></li>
            <li><Link href="/resources" className="hover:text-white transition-colors duration-200">Brochures &amp; Technical</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-gold">Manufacturers</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/partners" className="hover:text-white transition-colors duration-200">Our Partners</Link></li>
            <li><Link href="/partners" className="hover:text-white transition-colors duration-200">Brand Index</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-gold">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/contact" className="hover:text-white transition-colors duration-200">Get in Touch</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors duration-200">Request a Quote</Link></li>
            {company.phone && (
              <li>
                <a
                  href={`tel:${company.phone.replace(/\s+/g, '')}`}
                  className="text-gray-400 hover:text-gold transition-colors text-xs flex items-center gap-1.5 pt-1"
                >
                  <span className="material-symbols-outlined text-sm!">call</span>
                  <span>{company.phone}</span>
                </a>
              </li>
            )}
            {company.email && (
              <li>
                <a
                  href={`mailto:${company.email}`}
                  className="text-gray-400 hover:text-gold transition-colors text-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm!">mail</span>
                  <span>{company.email}</span>
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>&copy; {new Date().getFullYear()} {company.companyName || 'SA Healthcare'}. All rights reserved.</p>
        <div className="space-x-4">
          <Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors duration-200">Terms of Use</Link>
        </div>
      </div>
    </footer>
  );
}
