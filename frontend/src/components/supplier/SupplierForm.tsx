'use client';

import React, { useState, useEffect } from 'react';
import { inquiriesApi, categoriesApi, CategoryItem, ApiError } from '@/lib/api';

interface SupplierFormState {
  companyName: string;
  website: string;
  contactPerson: string;
  jobTitle: string;
  email: string;
  phone: string;
  category: string;
  overview: string;
}

interface SupplierFormErrors {
  companyName?: string;
  website?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  category?: string;
  overview?: string;
}

export default function SupplierForm() {
  const [formData, setFormData] = useState<SupplierFormState>({
    companyName: '',
    website: '',
    contactPerson: '',
    jobTitle: '',
    email: '',
    phone: '',
    category: '',
    overview: '',
  });

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [errors, setErrors] = useState<SupplierFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    categoriesApi
      .listCategories()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories for supplier form:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const validate = (): boolean => {
    const newErrors: SupplierFormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/[^0-9]/g, '').length < 7) {
      newErrors.phone = 'Please enter a valid phone number (at least 7 digits)';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a primary product category';
    }

    if (!formData.overview.trim()) {
      newErrors.overview = 'Please provide a brief company or product overview';
    } else if (formData.overview.trim().length < 15) {
      newErrors.overview = 'Overview must be at least 15 characters long';
    }

    if (formData.website.trim()) {
      try {
        const urlToTest = formData.website.startsWith('http://') || formData.website.startsWith('https://')
          ? formData.website
          : `https://${formData.website}`;
        new URL(urlToTest);
      } catch {
        newErrors.website = 'Please enter a valid website URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof SupplierFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof SupplierFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await inquiriesApi.submitSupplier({
        company_name: formData.companyName.trim(),
        website: formData.website.trim() || undefined,
        contact_person: formData.contactPerson.trim(),
        job_title: formData.jobTitle.trim() || undefined,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        category: formData.category,
        overview: formData.overview.trim(),
      });
      setIsSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-slate-50 p-8 md:p-12 rounded-2xl border border-gray-100 text-center animate-fadeIn space-y-4">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h3 className="text-2xl font-bold text-navy">Application Received!</h3>
        <p className="text-gray-600 max-w-lg mx-auto text-sm leading-relaxed">
          Thank you for applying to partner with SA Healthcare, <span className="font-semibold text-navy">{formData.contactPerson}</span> from <span className="font-semibold text-navy">{formData.companyName}</span>. Our procurement and compliance team will review your catalogue and contact you at <span className="font-semibold text-navy">{formData.email}</span>.
        </p>
        <button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({
              companyName: '',
              website: '',
              contactPerson: '',
              jobTitle: '',
              email: '',
              phone: '',
              category: '',
              overview: '',
            });
            setErrors({});
          }}
          className="mt-4 bg-navy text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-navy-light transition-all shadow-sm hover:scale-105 active:scale-95"
        >
          Submit Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Your Manufacturing Co."
            value={formData.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            className={`p-3 bg-white border rounded-lg shadow-xs outline-none transition-colors ${
              errors.companyName
                ? 'border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20'
                : 'border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20'
            }`}
          />
          {errors.companyName && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
              <span className="material-symbols-outlined text-sm!">error</span>
              <span>{errors.companyName}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">Website</label>
          <input
            type="text"
            placeholder="https://www.example.com"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            className={`p-3 bg-white border rounded-lg shadow-xs outline-none transition-colors ${
              errors.website
                ? 'border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20'
                : 'border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20'
            }`}
          />
          {errors.website && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
              <span className="material-symbols-outlined text-sm!">error</span>
              <span>{errors.website}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">
            Contact Person Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Jane Doe"
            value={formData.contactPerson}
            onChange={(e) => handleChange('contactPerson', e.target.value)}
            className={`p-3 bg-white border rounded-lg shadow-xs outline-none transition-colors ${
              errors.contactPerson
                ? 'border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20'
                : 'border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20'
            }`}
          />
          {errors.contactPerson && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
              <span className="material-symbols-outlined text-sm!">error</span>
              <span>{errors.contactPerson}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">Job Title</label>
          <input
            type="text"
            placeholder="Sales Director"
            value={formData.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            className="p-3 bg-white border border-gray-200 rounded-lg shadow-xs outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="jane@example.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`p-3 bg-white border rounded-lg shadow-xs outline-none transition-colors ${
              errors.email
                ? 'border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20'
                : 'border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20'
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
              <span className="material-symbols-outlined text-sm!">error</span>
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="+1 234 567 8900"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`p-3 bg-white border rounded-lg shadow-xs outline-none transition-colors ${
              errors.phone
                ? 'border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20'
                : 'border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20'
            }`}
          />
          {errors.phone && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
              <span className="material-symbols-outlined text-sm!">error</span>
              <span>{errors.phone}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">
          Primary Product Categories <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className={`p-3 bg-white border rounded-lg shadow-xs outline-none transition-colors text-gray-700 ${
            errors.category
              ? 'border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20'
              : 'border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20'
          }`}
        >
          <option value="">Select a category...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
        {errors.category && (
          <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
            <span className="material-symbols-outlined text-sm!">error</span>
            <span>{errors.category}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">
          Company & Product Overview <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="Briefly introduce your company and the range of products you manufacture."
          rows={5}
          value={formData.overview}
          onChange={(e) => handleChange('overview', e.target.value)}
          className={`p-3 bg-white border rounded-lg shadow-xs outline-none transition-colors ${
            errors.overview
              ? 'border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20'
              : 'border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20'
          }`}
        />
        {errors.overview && (
          <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
            <span className="material-symbols-outlined text-sm!">error</span>
            <span>{errors.overview}</span>
          </p>
        )}
      </div>

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{submitError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-gold text-navy font-bold py-4 rounded-full hover:bg-gold-bright transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-4 flex justify-center items-center text-lg cursor-pointer disabled:opacity-60 shadow-md"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
        <span className="material-symbols-outlined ml-2">send</span>
      </button>
    </form>
  );
}
