"use client";

import { CompanyContent, contentApi } from "@/lib/api";
import { DEFAULT_COMPANY } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [company, setCompany] = useState<CompanyContent>(DEFAULT_COMPANY);

  useEffect(() => {
    contentApi
      .getAll()
      .then((data) => {
        if (data.company) {
          const c = data.company;
          setCompany((prev) => ({
            ...prev,
            companyName: c.companyName || c.company_name || prev.companyName,
            phone: c.phone || prev.phone,
            tollFree: c.tollFree || c.toll_free || prev.tollFree,
            email: c.email || prev.email,
            salesEmail: c.salesEmail || c.sales_email || prev.salesEmail,
            physicalAddress:
              c.physicalAddress || c.physical_address || prev.physicalAddress,
            hours: c.hours || prev.hours,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const phoneRaw = (company.phone || "+27 11 555 0100").replace(/\s+/g, "");
  const tollFreeRaw = (company.tollFree || "0800 123 456").replace(/\s+/g, "");

  return (
    <footer className="bg-navy text-white pt-16 pb-12 px-6 print:hidden border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Column 1: Company Profile & Location */}
        <div className="flex flex-col space-y-4">
          <Link
            href="/home"
            className="inline-flex items-center transition-opacity hover:opacity-90 shrink-0"
          >
            <Image
              src="/logo.png"
              alt={company.companyName || "SA Healthcare Logo"}
              width={140}
              height={48}
              className="object-contain h-10 sm:h-11 w-auto max-w-44"
              style={{ width: "auto", height: "auto" }}
            />
          </Link>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Supplying reliable, innovative, and cost-effective medical equipment
            and healthcare solutions across Southern Africa.
          </p>

          <div className="space-y-2 text-xs text-gray-300 pt-1">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-base! text-gold shrink-0 mt-0.5">
                location_on
              </span>
              <span>
                {company.physicalAddress ||
                  "15 Medical Boulevard, Sandton, Johannesburg, South Africa"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base! text-gold shrink-0">
                schedule
              </span>
              <span>
                {company.hours || "Monday – Friday: 08:00 – 17:00 (SAST)"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <a
              href={`tel:${phoneRaw}`}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold hover:text-navy flex items-center justify-center text-gray-300 transition-all duration-200"
              title={`Call ${company.phone || "+27 11 555 0100"}`}
            >
              <span className="material-symbols-outlined text-base!">call</span>
            </a>
            <a
              href={`mailto:${company.email || "info@sahealthcare.com"}`}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold hover:text-navy flex items-center justify-center text-gray-300 transition-all duration-200"
              title={`Email ${company.email || "SA Healthcare"}`}
            >
              <span className="material-symbols-outlined text-base!">mail</span>
            </a>
            <Link
              href="/contact"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-gold hover:text-navy flex items-center justify-center text-gray-300 transition-all duration-200"
              title="Office & Contact Information"
            >
              <span className="material-symbols-outlined text-base!">
                domain
              </span>
            </Link>
          </div>
        </div>

        {/* Column 2: Equipment Categories (Each goes to a unique filtered catalogue view) */}
        <div>
          <h4 className="font-semibold mb-4 text-gold text-sm uppercase tracking-wider">
            Equipment Categories
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-gray-300">
            <li>
              <Link
                href="/products"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Browse All Products</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products?category=Diagnostic%20and%20Measure"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Diagnostic & Monitoring</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products?category=Emergency%2C%20Reanimation%20and%20Surgery"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Emergency & Surgical</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products?category=Furniture"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Hospital Furniture</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products?category=Living%20Aid"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Living Aids & Mobility</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products?category=Hygiene%20and%20Sterilisation"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Hygiene & Sterilisation</span>
              </Link>
            </li>
            <li>
              <Link
                href="/compare"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  compare_arrows
                </span>
                <span>Compare Equipment</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Company & Partners (Single, distinct, useful pages) */}
        <div>
          <h4 className="font-semibold mb-4 text-gold text-sm uppercase tracking-wider">
            Company &amp; Solutions
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-gray-300">
            <li>
              <Link
                href="/about"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>About SA Healthcare</span>
              </Link>
            </li>
            <li>
              <Link
                href="/solutions"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Solutions &amp; Services</span>
              </Link>
            </li>
            <li>
              <Link
                href="/resources"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Resource Centre</span>
              </Link>
            </li>
            <li>
              <Link
                href="/sectors"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Healthcare Sectors</span>
              </Link>
            </li>
            <li>
              <Link
                href="/partners"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Partner Manufacturers</span>
              </Link>
            </li>
            <li>
              <Link
                href="/supplier"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  chevron_right
                </span>
                <span>Become a Supplier</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Quotations & Support */}
        <div>
          <h4 className="font-semibold mb-4 text-gold text-sm uppercase tracking-wider">
            Quotes & Support
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-gray-300">
            <li>
              <Link
                href="/quote"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  shopping_cart
                </span>
                <span>Request a Quote</span>
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-gold transition-colors duration-200 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm! text-gold/70">
                  contact_support
                </span>
                <span>Contact & Inquiries</span>
              </Link>
            </li>
            <li className="pt-2 border-t border-white/10 space-y-1.5 text-xs">
              <a
                href={`tel:${phoneRaw}`}
                className="text-gray-300 hover:text-gold transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm! text-gold">
                  call
                </span>
                <span>{company.phone || "+27 11 555 0100"}</span>
              </a>
              {company.tollFree && (
                <a
                  href={`tel:${tollFreeRaw}`}
                  className="text-gray-300 hover:text-gold transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm! text-gold">
                    ring_volume
                  </span>
                  <span>Toll-Free: {company.tollFree}</span>
                </a>
              )}
              <a
                href={`mailto:${
                  company.salesEmail || company.email || "info@sahealthcare.com"
                }`}
                className="text-gray-300 hover:text-gold transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm! text-gold">
                  mail
                </span>
                <span>
                  {company.salesEmail ||
                    company.email ||
                    "info@sahealthcare.com"}
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>
          &copy; {new Date().getFullYear()}{" "}
          {company.companyName || "SA Healthcare"}. All rights reserved.
        </p>
        <div className="flex items-center space-x-6">
          <Link
            href="/privacy"
            className="hover:text-gold transition-colors duration-200"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="hover:text-gold transition-colors duration-200"
          >
            Terms of Use
          </Link>
          <Link
            href="/contact"
            className="hover:text-gold transition-colors duration-200"
          >
            Help & Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
