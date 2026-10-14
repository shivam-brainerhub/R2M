"use client";

import { useEffect, useState } from 'react';
import { contentApi, CompanyContent } from '@/lib/api';

const DEFAULT_COMPANY: CompanyContent = {
  companyName: 'SA Healthcare',
  phone: '+27 11 555 0100',
  tollFree: '0800 123 456',
  email: 'info@sahealthcare.com',
  salesEmail: 'quotes@sahealthcare.com',
  physicalAddress: '15 Medical Boulevard, Sandton, Johannesburg, 2196, South Africa',
  hours: 'Monday – Friday: 08:00 – 17:00 (SAST)',
};

export default function ContactInfoCards() {
  const [company, setCompany] = useState<CompanyContent>(DEFAULT_COMPANY);

  useEffect(() => {
    contentApi
      .getAll()
      .then((data) => {
        if (data.company) {
          setCompany({
            companyName: data.company.companyName || data.company.company_name || DEFAULT_COMPANY.companyName,
            phone: data.company.phone || DEFAULT_COMPANY.phone,
            tollFree: data.company.tollFree || data.company.toll_free || DEFAULT_COMPANY.tollFree,
            email: data.company.email || DEFAULT_COMPANY.email,
            salesEmail: data.company.salesEmail || data.company.sales_email || DEFAULT_COMPANY.salesEmail,
            physicalAddress: data.company.physicalAddress || data.company.physical_address || DEFAULT_COMPANY.physicalAddress,
            hours: data.company.hours || DEFAULT_COMPANY.hours,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xs h-full">
      <h3 className="text-xl font-bold text-navy mb-6">Contact Information</h3>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-gold text-2xl!">location_on</span>
          <div>
            <h4 className="font-semibold text-navy">Head Office</h4>
            <p className="text-gray-600 mt-1 whitespace-pre-line">{company.physicalAddress}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-gold text-2xl!">phone</span>
          <div>
            <h4 className="font-semibold text-navy">Phone</h4>
            <p className="text-gray-600 mt-1">
              <a href={`tel:${company.phone.replace(/\s+/g, '')}`} className="hover:text-blue-600 transition-colors">
                {company.phone}
              </a>
              {company.tollFree && (
                <span className="block text-xs text-gray-500 mt-0.5">Toll-free: {company.tollFree}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-gold text-2xl!">mail</span>
          <div>
            <h4 className="font-semibold text-navy">Email</h4>
            <p className="text-gray-600 mt-1">
              <a href={`mailto:${company.email}`} className="hover:text-blue-600 transition-colors block">
                {company.email}
              </a>
              {company.salesEmail && company.salesEmail !== company.email && (
                <span className="block text-xs text-gray-500 mt-0.5">
                  Quotations: <a href={`mailto:${company.salesEmail}`} className="hover:text-blue-600">{company.salesEmail}</a>
                </span>
              )}
            </p>
          </div>
        </div>

        {company.hours && (
          <div className="flex items-start gap-4 pt-2 border-t border-gray-100">
            <span className="material-symbols-outlined text-gold text-2xl!">schedule</span>
            <div>
              <h4 className="font-semibold text-navy">Operating Hours</h4>
              <p className="text-gray-600 mt-1 text-sm">{company.hours}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
