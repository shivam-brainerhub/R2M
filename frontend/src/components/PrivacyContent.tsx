"use client";

import { contentApi, LegalContent } from "@/lib/api";
import { DEFAULT_PRIVACY_POLICY } from "@/lib/constants";
import Link from "next/link";
import { useEffect, useState } from "react";

function getRenderableHtml(data: LegalContent): string {
  if (data.content && data.content.trim().length > 0) {
    if (/<[a-z][\s\S]*>/i.test(data.content)) {
      return data.content;
    }
    return data.content
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }
  if (data.sections && data.sections.length > 0) {
    return data.sections
      .map(
        (s) =>
          `<h2>${s.heading}</h2><p>${s.content.replace(/\n/g, "<br/>")}</p>`,
      )
      .join("");
  }
  return "";
}

export default function PrivacyContent() {
  const [policy, setPolicy] = useState<LegalContent>(DEFAULT_PRIVACY_POLICY);

  useEffect(() => {
    let active = true;

    contentApi
      .getSection("privacy_policy")
      .then((res) => {
        if (!active || !res?.content) return;
        const c = res.content as Partial<LegalContent>;
        setPolicy((prev) => ({
          title: c.title || prev.title,
          subtitle: c.subtitle !== undefined ? c.subtitle : prev.subtitle,
          lastUpdated: c.lastUpdated || c.last_updated || prev.lastUpdated,
          content:
            c.content !== undefined && c.content !== ""
              ? c.content
              : prev.content,
          sections:
            Array.isArray(c.sections) && c.sections.length > 0
              ? c.sections
              : prev.sections,
        }));
      })
      .catch((err) => {
        console.error("Failed to fetch privacy policy from CMS:", err);
      });

    return () => {
      active = false;
    };
  }, []);

  const htmlContent = getRenderableHtml(policy);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Banner */}
      <section className="bg-navy text-white py-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {policy.title}
          </h1>
          {policy.subtitle && (
            <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto">
              {policy.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-6 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xs border border-gray-100 space-y-8 text-gray-700 leading-relaxed">
          {policy.lastUpdated && (
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                Last Updated: {policy.lastUpdated}
              </span>
            </div>
          )}

          {/* Formatted Rich Text Content */}
          <div
            className="prose prose-slate max-w-none prose-headings:text-navy prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4 prose-li:text-gray-600 prose-ul:list-disc prose-ul:ml-6 prose-ol:list-decimal prose-ol:ml-6 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-navy prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
            <Link
              href="/"
              className="text-sm font-semibold text-blue-600 hover:text-navy transition-colors"
            >
              &larr; Back to Home
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold text-navy hover:text-gold transition-colors"
            >
              Contact Support &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
