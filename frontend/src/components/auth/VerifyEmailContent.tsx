'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authApi, ApiError } from '@/lib/api';

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(() =>
    token ? 'verifying' : 'error'
  );
  const [message, setMessage] = useState<string>(() =>
    token
      ? 'Verifying your email address...'
      : 'Missing confirmation token. Please check your verification link or request a new one.'
  );
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const verify = async () => {
      try {
        const resp = await authApi.verifyEmail(token);
        if (isMounted) {
          setStatus('success');
          setMessage(resp.message || 'Email successfully verified! You can now log in.');
        }
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          if (err instanceof ApiError) {
            setMessage(err.message);
          } else {
            setMessage('Invalid or expired confirmation link.');
          }
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const [emailError, setEmailError] = useState<string | null>(null);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = resendEmail.trim();
    if (!trimmed) {
      setEmailError('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError(null);
    setIsResending(true);
    setResendStatus(null);
    try {
      await authApi.resendVerification(trimmed);
      setResendStatus('A new confirmation link has been sent if an unverified account exists.');
    } catch {
      setResendStatus('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 text-center animate-fadeIn space-y-6">
        
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-navy/5 border border-navy/15 rounded-2xl mx-auto flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-extrabold text-navy">
              Confirming your email
            </h2>
            <p className="text-sm text-gray-500">
              Please wait while we verify your SA Healthcare account...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-navy">
                Email Confirmed!
              </h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {message}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-navy bg-gold hover:bg-gold-bright transition-all shadow-md hover:shadow-lg"
              >
                Log In to Your Account
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-navy">
                Confirmation Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {message}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 text-left">
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">
                Need a new confirmation link?
              </h3>
              <form onSubmit={handleResend} noValidate className="space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => {
                      setResendEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      emailError
                        ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/20'
                        : 'border-gray-300 focus:ring-navy'
                    }`}
                  />
                  {emailError && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium animate-fadeIn">
                      <span className="material-symbols-outlined text-sm!">error</span>
                      <span>{emailError}</span>
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isResending}
                  className="w-full py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy-light transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isResending ? 'Sending...' : 'Send New Confirmation Link'}
                </button>
              </form>

              {resendStatus && (
                <div className="mt-2 text-xs font-semibold text-emerald-700">
                  {resendStatus}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="text-xs text-navy font-semibold hover:text-gold transition-colors"
              >
                Return to Login
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
