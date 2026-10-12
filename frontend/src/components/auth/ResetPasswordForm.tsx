'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi, ApiError } from '@/lib/api';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const errors: { [key: string]: string } = {};

    const activeToken = token.trim();
    if (!activeToken) {
      errors.token = 'Reset token is required. Please paste your reset token.';
    }

    if (!newPassword) {
      errors.newPassword = 'Please enter a new password.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    try {
      const response = await authApi.resetPassword({
        token: activeToken,
        new_password: newPassword,
      });

      setSuccessMessage(response.message || 'Password has been successfully reset! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to reset password. The link may have expired.');
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
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Please enter your new password below.
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
            className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm animate-fadeIn"
          >
            <span className="material-symbols-outlined text-emerald-500 text-xl shrink-0">
              check_circle
            </span>
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {!tokenParam && (
              <div>
                <label
                  htmlFor="reset-token"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
                >
                  Reset Token <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reset-token"
                    name="token"
                    type="text"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      if (fieldErrors.token) {
                        setFieldErrors((prev) => ({ ...prev, token: '' }));
                      }
                    }}
                    disabled={isLoading}
                    className={`appearance-none relative block w-full px-3 py-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-xs font-mono transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                      fieldErrors.token
                        ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20'
                        : 'border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-navy focus:border-navy'
                    }`}
                    placeholder="Paste reset token here"
                  />
                  <span className={`material-symbols-outlined absolute left-3 top-2.5 text-xl pointer-events-none ${
                    fieldErrors.token ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    key
                  </span>
                </div>
                {fieldErrors.token && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                    <span className="material-symbols-outlined text-sm">error</span>
                    <span>{fieldErrors.token}</span>
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.newPassword) {
                      setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                    }
                  }}
                  disabled={isLoading}
                  className={`appearance-none relative block w-full px-3 py-2.5 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                    fieldErrors.newPassword
                      ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-navy focus:border-navy'
                  }`}
                  placeholder="At least 6 characters"
                />
                <span className={`material-symbols-outlined absolute left-3 top-2.5 text-xl pointer-events-none ${
                  fieldErrors.newPassword ? 'text-red-400' : 'text-gray-400'
                }`}>
                  lock
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{fieldErrors.newPassword}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  disabled={isLoading}
                  className={`appearance-none relative block w-full px-3 py-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                    fieldErrors.confirmPassword
                      ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-navy focus:border-navy'
                  }`}
                  placeholder="Re-enter new password"
                />
                <span className={`material-symbols-outlined absolute left-3 top-2.5 text-xl pointer-events-none ${
                  fieldErrors.confirmPassword ? 'text-red-400' : 'text-gray-400'
                }`}>
                  lock_reset
                </span>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              )}
            </div>
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
                  <span>Resetting password...</span>
                </div>
              ) : (
                'Reset password'
              )}
            </button>

            <p className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
              Remember your password?{' '}
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
