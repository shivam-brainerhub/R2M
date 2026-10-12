'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authApi, ApiError } from '@/lib/api';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { login } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
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
    if (!usernameOrEmail.trim()) {
      errors.usernameOrEmail = 'Please enter your email or username.';
    }
    if (!password) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    try {
      const user = await login(
        {
          username_or_email: usernameOrEmail.trim(),
          password,
        },
        rememberMe
      );

      setSuccessMessage('Login successful! Redirecting...');

      // Redirect based on user role or redirect query parameter
      setTimeout(() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/home');
        }
      }, 500);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to connect to the authentication server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const isUnverifiedError = errorMessage && errorMessage.toLowerCase().includes('confirm your email');

  const handleResendVerification = async () => {
    if (!usernameOrEmail.trim()) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      await authApi.resendVerification(usernameOrEmail.trim());
      setResendStatus('A new confirmation link has been sent to your email.');
    } catch {
      setResendStatus('Failed to send confirmation email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-xl border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-navy">
            Login to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Welcome back! Please enter your details.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex flex-col gap-2 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm animate-fadeIn"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 text-xl shrink-0">
                error
              </span>
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>

            {isUnverifiedError && (
              <div className="pt-2 border-t border-red-200/60 flex items-center justify-between">
                <span className="text-xs text-red-700">Didn&apos;t receive the link?</span>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="text-xs font-bold text-red-900 underline hover:text-red-700 disabled:opacity-60"
                >
                  {isResending ? 'Sending...' : 'Resend confirmation email'}
                </button>
              </div>
            )}

            {resendStatus && (
              <div className="text-xs font-semibold text-emerald-700 mt-1">
                {resendStatus}
              </div>
            )}
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
            <div>
              <label
                htmlFor="username-or-email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Email or Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="username-or-email"
                  name="username_or_email"
                  type="text"
                  autoComplete="username email"
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value);
                    if (fieldErrors.usernameOrEmail) {
                      setFieldErrors((prev) => ({ ...prev, usernameOrEmail: '' }));
                    }
                  }}
                  disabled={isLoading}
                  className={`appearance-none relative block w-full px-3 py-2.5 pl-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                    fieldErrors.usernameOrEmail
                      ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-navy focus:border-navy'
                  }`}
                  placeholder="admin@yopmail.com or admin"
                />
                <span className={`material-symbols-outlined absolute left-3 top-2.5 text-xl pointer-events-none ${
                  fieldErrors.usernameOrEmail ? 'text-red-400' : 'text-gray-400'
                }`}>
                  mail
                </span>
              </div>
              {fieldErrors.usernameOrEmail && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{fieldErrors.usernameOrEmail}</span>
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
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }
                  }}
                  disabled={isLoading}
                  className={`appearance-none relative block w-full px-3 py-2.5 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-500 ${
                    fieldErrors.password
                      ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20'
                      : 'border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-navy focus:border-navy'
                  }`}
                  placeholder="••••••••"
                />
                <span className={`material-symbols-outlined absolute left-3 top-2.5 text-xl pointer-events-none ${
                  fieldErrors.password ? 'text-red-400' : 'text-gray-400'
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
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer select-none">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-navy focus:ring-navy border-gray-300 rounded cursor-pointer"
              />
              <span className="ml-2 block text-sm text-gray-700">Remember me</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-navy hover:text-gold transition-colors"
            >
              Forgot password?
            </Link>
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
                  <span>Logging in...</span>
                </div>
              ) : (
                'Login'
              )}
            </button>

            <div className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-navy underline decoration-2 underline-offset-2 hover:text-gold transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
