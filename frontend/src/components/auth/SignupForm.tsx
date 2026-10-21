"use client";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import Link from "next/link";
import React, { useState } from "react";

export default function SignupForm() {
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors: { [key: string]: string } = {};

    if (!username.trim()) {
      errors.username = "Please enter a username.";
    } else if (username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters long.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!emailRegex.test(email.trim())) {
      errors.email =
        "Please enter a valid email address (e.g. name@hospital.com).";
    }

    if (!password) {
      errors.password = "Please create a password.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);

    try {
      await register({
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password,
        full_name: fullName.trim() || undefined,
        organization: organization.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      setRegisteredEmail(email.trim().toLowerCase());
      setIsRegistered(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-gold/15 text-gold-dark border border-gold/30 rounded-2xl mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">
              mark_email_unread
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-navy">
              Verify your email
            </h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              We&apos;ve sent a confirmation email to:
            </p>
            <p className="font-semibold text-navy mt-1 text-sm bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200 inline-block break-all">
              {registeredEmail}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 text-left space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-base text-amber-600">
                info
              </span>
              <span>Important note</span>
            </div>
            <p>
              Please check your inbox and click the verification link before
              logging in. You won&apos;t be able to sign in until your email is
              confirmed.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href={`/login?email=${encodeURIComponent(registeredEmail)}`}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-navy bg-gold hover:bg-gold-bright transition-all shadow-md hover:shadow-lg"
            >
              Proceed to Login
            </Link>

            <Link
              href="/home"
              className="text-xs text-gray-500 hover:text-navy transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-navy">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Join SA Healthcare to build custom quote inquiries.
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

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="full-name"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Full Name{" "}
                <span className="text-gray-400 font-normal lowercase">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="appearance-none relative block w-full px-3 py-2.5 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Dr. Sarah Adams"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-xl pointer-events-none">
                  badge
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="organization"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Organisation / Facility{" "}
                <span className="text-gray-400 font-normal lowercase">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  disabled={isLoading}
                  className="appearance-none relative block w-full px-3 py-2.5 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="e.g. Netcare / Mediclinic / Cape Health"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-xl pointer-events-none">
                  corporate_fare
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Telephone / Mobile{" "}
                <span className="text-gray-400 font-normal lowercase">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className="appearance-none relative block w-full px-3 py-2.5 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="e.g. +27 21 555 0100"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-xl pointer-events-none">
                  call
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) {
                      setFieldErrors((prev) => ({ ...prev, username: "" }));
                    }
                  }}
                  disabled={isLoading}
                  className={`appearance-none relative block w-full px-3 py-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                    fieldErrors.username
                      ? "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20"
                      : "border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-navy focus:border-navy"
                  }`}
                  placeholder="sarah_adams"
                />
                <span
                  className={`material-symbols-outlined absolute left-3 top-2.5 text-xl pointer-events-none ${
                    fieldErrors.username ? "text-red-400" : "text-gray-400"
                  }`}
                >
                  person
                </span>
              </div>
              {fieldErrors.username && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                  <span className="material-symbols-outlined text-sm">
                    error
                  </span>
                  <span>{fieldErrors.username}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email-address"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
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
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                  disabled={isLoading}
                  className={`appearance-none relative block w-full px-3 py-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                    fieldErrors.email
                      ? "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20"
                      : "border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-navy focus:border-navy"
                  }`}
                  placeholder="name@hospital.com"
                />
                <span
                  className={`material-symbols-outlined absolute left-3 top-2.5 text-xl pointer-events-none ${
                    fieldErrors.email ? "text-red-400" : "text-gray-400"
                  }`}
                >
                  mail
                </span>
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                  <span className="material-symbols-outlined text-sm">
                    error
                  </span>
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                  disabled={isLoading}
                  className={`appearance-none relative block w-full px-3 py-2.5 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                    fieldErrors.password
                      ? "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20"
                      : "border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-navy focus:border-navy"
                  }`}
                  placeholder="At least 6 characters"
                />
                <span
                  className={`material-symbols-outlined absolute left-3 top-2.5 text-xl pointer-events-none ${
                    fieldErrors.password ? "text-red-400" : "text-gray-400"
                  }`}
                >
                  lock
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                  <span className="material-symbols-outlined text-sm">
                    error
                  </span>
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: "",
                      }));
                    }
                  }}
                  disabled={isLoading}
                  className={`appearance-none relative block w-full px-3 py-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                    fieldErrors.confirmPassword
                      ? "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20"
                      : "border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-navy focus:border-navy"
                  }`}
                  placeholder="Re-enter password"
                />
                <span
                  className={`material-symbols-outlined absolute left-3 top-2.5 text-xl pointer-events-none ${
                    fieldErrors.confirmPassword
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  lock_reset
                </span>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                  <span className="material-symbols-outlined text-sm">
                    error
                  </span>
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-4 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-navy hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-navy underline decoration-2 underline-offset-2 hover:text-gold transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
