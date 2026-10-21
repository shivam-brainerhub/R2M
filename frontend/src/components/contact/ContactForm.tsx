"use client";

import { ApiError, inquiriesApi } from "@/lib/api";
import React, { useState } from "react";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  message?: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.message.trim()) {
      newErrors.message = "Please provide a message or inquiry details";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await inquiriesApi.submitContact({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        organization: formData.organization.trim() || undefined,
        message: formData.message.trim(),
      });
      setIsSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center animate-fadeIn space-y-4">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl">
            check_circle
          </span>
        </div>
        <h3 className="text-2xl font-bold text-navy">Message Received!</h3>
        <p className="text-gray-600 max-w-md mx-auto text-sm leading-relaxed">
          Thank you for reaching out,{" "}
          <span className="font-semibold text-navy">{formData.firstName}</span>.
          A representative from our healthcare solutions team will contact you
          shortly at{" "}
          <span className="font-semibold text-navy">{formData.email}</span>.
        </p>
        <button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({
              firstName: "",
              lastName: "",
              email: "",
              organization: "",
              message: "",
            });
            setErrors({});
          }}
          className="mt-4 bg-navy text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-navy-light transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            className={`p-3 bg-white border rounded-lg shadow-xs transition-colors outline-none ${
              errors.firstName
                ? "border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20"
                : "border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20"
            }`}
          />
          {errors.firstName && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
              <span className="material-symbols-outlined text-sm!">error</span>
              <span>{errors.firstName}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-navy">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            className={`p-3 bg-white border rounded-lg shadow-xs transition-colors outline-none ${
              errors.lastName
                ? "border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20"
                : "border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20"
            }`}
          />
          {errors.lastName && (
            <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
              <span className="material-symbols-outlined text-sm!">error</span>
              <span>{errors.lastName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className={`p-3 bg-white border rounded-lg shadow-xs transition-colors outline-none ${
            errors.email
              ? "border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20"
              : "border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20"
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
        <label className="text-sm font-semibold text-navy">Organization</label>
        <input
          type="text"
          placeholder="Your Hospital or Clinic"
          value={formData.organization}
          onChange={(e) => handleChange("organization", e.target.value)}
          className="p-3 bg-white border border-gray-200 rounded-lg shadow-xs focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-navy">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          placeholder="How can we help you?"
          rows={5}
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
          className={`p-3 bg-white border rounded-lg shadow-xs transition-colors outline-none ${
            errors.message
              ? "border-red-400 focus:ring-2 focus:ring-red-400/30 focus:border-red-500 bg-red-50/20"
              : "border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20"
          }`}
        />
        {errors.message && (
          <p className="text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
            <span className="material-symbols-outlined text-sm!">error</span>
            <span>{errors.message}</span>
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
        className="bg-gold text-navy font-bold py-3 rounded-full hover:bg-gold-bright transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-2 flex justify-center items-center cursor-pointer disabled:opacity-60 shadow-md"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
        <span className="material-symbols-outlined ml-2 text-sm!">send</span>
      </button>
    </form>
  );
}
