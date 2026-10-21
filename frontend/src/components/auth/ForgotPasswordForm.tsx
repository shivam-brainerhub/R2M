"use client";

import { ApiError, authApi } from "@/lib/api";
import Link from "next/link";
import React, { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmailError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError("Please enter your email address.");
      return;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError(
        "Please enter a valid email address (e.g. name@hospital.com).",
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword({
        email: email.trim().toLowerCase(),
      });
      setSuccessMessage(
        response.message ||
          "If an account with that email exists, password reset instructions have been sent.",
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Failed to send reset link. Please check your connection and try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-navy">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Enter your email and we&apos;ll send you instructions to reset your
            password.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm animate-fadeIn"
          >
            <span className="material-symbols-outlined text-red-500 text-xl shrink-0">
              error
            </span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm animate-fadeIn"
          >
            <span className="material-symbols-outlined text-emerald-500 text-xl shrink-0">
              check_circle
            </span>
            <div className="font-medium leading-relaxed">{successMessage}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="email-address"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
            >
              Email address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                disabled={isLoading}
                className={`appearance-none relative block w-full px-3 py-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                  emailError
                    ? "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20"
                    : "border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-navy focus:border-navy"
                }`}
                placeholder="name@hospital.com"
              />
              <span
                className={`material-symbols-outlined absolute left-3 top-2.5 text-xl pointer-events-none ${
                  emailError ? "text-red-400" : "text-gray-400"
                }`}
              >
                mail
              </span>
            </div>
            {emailError && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{emailError}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-navy hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending reset link...</span>
                </div>
              ) : (
                "Send reset link"
              )}
            </button>

            <p className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-navy underline decoration-2 underline-offset-2 hover:text-gold transition-colors"
              >
                Back to login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
