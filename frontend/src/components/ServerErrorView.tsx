"use client";

import Link from "next/link";
import { useState } from "react";

interface ServerErrorViewProps {
  error?: Error & { digest?: string };
  reset?: () => void;
}

export default function ServerErrorView({
  error,
  reset,
}: ServerErrorViewProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleRetry = () => {
    if (reset) {
      reset();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold tracking-widest uppercase mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          Error 500 &bull; Internal Server Error
        </div>

        {/* Central Graphic / Icon */}
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <span className="material-symbols-outlined text-4xl!">
            sync_problem
          </span>
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-navy tracking-tight mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 text-base sm:text-lg max-w-lg mx-auto mb-8 leading-relaxed font-light">
          An unexpected error occurred while communicating with our medical
          catalogue services. Please try again or reach out if the problem
          persists.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-gold text-navy font-bold px-6 py-3 rounded-full hover:bg-gold-bright transition-all duration-300 hover:scale-105 active:scale-95 shadow-md text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg!">refresh</span>
            Try Again
          </button>

          <Link
            href="/home"
            className="inline-flex items-center gap-2 bg-navy text-white font-semibold px-6 py-3 rounded-full hover:bg-navy-light transition-all duration-300 hover:scale-105 active:scale-95 shadow-md text-sm"
          >
            <span className="material-symbols-outlined text-lg!">home</span>
            Return to Home
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-navy font-semibold px-6 py-3 rounded-full border border-gray-300 hover:border-navy hover:bg-gray-50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xs text-sm"
          >
            <span className="material-symbols-outlined text-lg!">
              support_agent
            </span>
            Contact Support
          </Link>
        </div>

        {/* Diagnostic Accordion */}
        {(error?.message || error?.digest) && (
          <div className="max-w-xl mx-auto mb-10 text-left bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-4 py-3 text-xs font-semibold text-gray-600 hover:text-navy flex items-center justify-between bg-gray-50/70 border-b border-gray-100 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm!">
                  terminal
                </span>
                Technical Details &amp; Error Digest
              </span>
              <span className="material-symbols-outlined text-sm!">
                {showDetails ? "expand_less" : "expand_more"}
              </span>
            </button>
            {showDetails && (
              <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto space-y-1">
                {error.digest && (
                  <div>
                    <span className="text-gray-400">Digest ID:</span>{" "}
                    {error.digest}
                  </div>
                )}
                {error.message && (
                  <div>
                    <span className="text-gray-400">Message:</span>{" "}
                    {error.message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Emergency Assistance Box */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-left max-w-xl mx-auto shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-navy text-2xl!">
              help
            </span>
            <h3 className="font-bold text-navy text-sm">
              Need immediate assistance?
            </h3>
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            If you are placing an urgent clinical inquiry or quotation, reach
            our healthcare representative directly:
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs font-medium text-navy">
            <a
              href="tel:+27115550100"
              className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
            >
              <span className="material-symbols-outlined text-base!">call</span>
              +27 11 555 0100
            </a>
            <span className="hidden sm:inline text-gray-300">&bull;</span>
            <a
              href="mailto:info@sahealthcare.com"
              className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
            >
              <span className="material-symbols-outlined text-base!">mail</span>
              info@sahealthcare.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
