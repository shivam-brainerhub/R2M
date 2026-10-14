'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
  customTitle?: string;
  customSubtitle?: string;
  submitButtonText?: string;
  customFooterNote?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  customTitle,
  customSubtitle,
  submitButtonText,
  customFooterNote,
}: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRemember, setLoginRemember] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // UI state
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signupSuccessMessage, setSignupSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your email or username.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(
        {
          username_or_email: loginIdentifier.trim(),
          password: loginPassword,
        },
        loginRemember
      );

      // Successfully authenticated
      setIsLoading(false);
      onSuccess();
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Authentication failed. Please verify your credentials.');
      }
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSignupSuccessMessage(null);

    if (!signupUsername.trim() || signupUsername.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signupEmail.trim() || !emailRegex.test(signupEmail.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        username: signupUsername.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        full_name: signupFullName.trim() || undefined,
      });

      // Show success message and pre-fill login
      setSignupSuccessMessage(
        'Account created successfully! Please confirm your email address via the link sent to your inbox, then sign in.'
      );
      setLoginIdentifier(signupEmail.trim());
      setMode('login');
      setIsLoading(false);
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to create account. Please try again.');
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden relative max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-navy p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer z-10"
          title="Close"
        >
          <span className="material-symbols-outlined text-xl!">close</span>
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 bg-slate-50/70">
          <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold-dark flex items-center justify-center mb-3 border border-gold/30">
            <span className="material-symbols-outlined text-2xl! text-navy">lock</span>
          </div>
          <h2 className="text-xl font-extrabold text-navy tracking-tight">
            {customTitle || (mode === 'login' ? 'Sign In to Request Quote' : 'Create an Account')}
          </h2>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {customSubtitle ||
              'Only authenticated users can submit formal quotation requests. Your selected equipment cart remains safely preserved.'}
          </p>

          {/* Toggle Tabs */}
          <div className="mt-4 grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-navy shadow-xs'
                  : 'text-gray-600 hover:text-navy'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-navy shadow-xs'
                  : 'text-gray-600 hover:text-navy'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
              <span className="material-symbols-outlined text-base! mt-0.5 shrink-0">error</span>
              <span className="flex-1 leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {signupSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
              <span className="material-symbols-outlined text-base! mt-0.5 shrink-0 text-emerald-600">
                check_circle
              </span>
              <span className="flex-1 leading-relaxed">{signupSuccessMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email or Username
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="name@hospital.co.za or username"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy transition-all"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    target="_blank"
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg!">
                      {showLoginPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loginRemember}
                    onChange={(e) => setLoginRemember(e.target.checked)}
                    className="rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-navy hover:bg-navy-light text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base!">progress_activity</span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>{submitButtonText || 'Sign In & Continue Quote'}</span>
                    <span className="material-symbols-outlined text-base!">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  placeholder="Dr. Johan van der Merwe"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="dr_johan"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Official Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="procurement@hospital.co.za"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-3.5 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg!">
                      {showSignupPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gold hover:bg-gold-bright text-navy font-black py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base!">progress_activity</span>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-base!">how_to_reg</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Footer Note */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 text-center text-[11px] text-gray-500">
          {customFooterNote !== undefined
            ? customFooterNote
            : 'Your quotation cart items and quantities will remain intact.'}
        </div>

      </div>
    </div>,
    document.body
  );
}
