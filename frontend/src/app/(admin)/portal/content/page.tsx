"use client";

import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  CompanyContent,
  contentApi,
  CTAContent,
  HeroContent,
  LegalContent,
  ProductsPageContent,
  WhyUsContent,
} from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  DEFAULT_COMPANY,
  DEFAULT_CTA,
  DEFAULT_HERO,
  DEFAULT_PRIVACY_POLICY,
  DEFAULT_PRODUCTS_PAGE,
  DEFAULT_TERMS_OF_USE,
  DEFAULT_WHY_US,
} from "@/lib/constants";

type ContentTab =
  | "hero"
  | "products_page"
  | "company"
  | "why_us"
  | "cta"
  | "privacy_policy"
  | "terms_of_use";

export default function AdminContentPage() {
  const { token, hasPermission } = useAuth();
  const canWriteContent = hasPermission("content", "write");
  const [activeTab, setActiveTab] = useState<ContentTab>("hero");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Content states
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO);
  const [productsPageContent, setProductsPageContent] =
    useState<ProductsPageContent>(DEFAULT_PRODUCTS_PAGE);
  const [companyInfo, setCompanyInfo] =
    useState<CompanyContent>(DEFAULT_COMPANY);
  const [whyUsContent, setWhyUsContent] =
    useState<WhyUsContent>(DEFAULT_WHY_US);
  const [ctaContent, setCtaContent] = useState<CTAContent>(DEFAULT_CTA);
  const [privacyPolicy, setPrivacyPolicy] = useState<LegalContent>(
    DEFAULT_PRIVACY_POLICY,
  );
  const [termsOfUse, setTermsOfUse] =
    useState<LegalContent>(DEFAULT_TERMS_OF_USE);

  // New search tag input helpers
  const [newTagInput, setNewTagInput] = useState("");
  const [newProductTagInput, setNewProductTagInput] = useState("");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;

    contentApi
      .getAll()
      .then((data) => {
        if (!isMounted) return;
        if (data.hero) {
          setHeroContent({
            headlinePart1:
              data.hero.headlinePart1 ||
              data.hero.headline_part1 ||
              DEFAULT_HERO.headlinePart1,
            headlinePart2:
              data.hero.headlinePart2 ||
              data.hero.headline_part2 ||
              DEFAULT_HERO.headlinePart2,
            headlineAccent:
              data.hero.headlineAccent ||
              data.hero.headline_accent ||
              DEFAULT_HERO.headlineAccent,
            subheading: data.hero.subheading || DEFAULT_HERO.subheading,
            showSearchBar:
              data.hero.showSearchBar !== undefined
                ? data.hero.showSearchBar
                : data.hero.show_search_bar !== undefined
                  ? data.hero.show_search_bar
                  : true,
            searchPlaceholder:
              data.hero.searchPlaceholder ||
              data.hero.search_placeholder ||
              DEFAULT_HERO.searchPlaceholder,
            popularSearches:
              data.hero.popularSearches ||
              data.hero.popular_searches ||
              DEFAULT_HERO.popularSearches,
            badgeTitle:
              data.hero.badgeTitle ||
              data.hero.badge_title ||
              DEFAULT_HERO.badgeTitle,
            badgeTagline:
              data.hero.badgeTagline ||
              data.hero.badge_tagline ||
              DEFAULT_HERO.badgeTagline,
          });
        }
        if (data.company) {
          setCompanyInfo({
            companyName:
              data.company.companyName ||
              data.company.company_name ||
              DEFAULT_COMPANY.companyName,
            phone: data.company.phone || DEFAULT_COMPANY.phone,
            tollFree:
              data.company.tollFree ||
              data.company.toll_free ||
              DEFAULT_COMPANY.tollFree,
            email: data.company.email || DEFAULT_COMPANY.email,
            salesEmail:
              data.company.salesEmail ||
              data.company.sales_email ||
              DEFAULT_COMPANY.salesEmail,
            physicalAddress:
              data.company.physicalAddress ||
              data.company.physical_address ||
              DEFAULT_COMPANY.physicalAddress,
            hours: data.company.hours || DEFAULT_COMPANY.hours,
          });
        }
        if (data.why_us) {
          setWhyUsContent({
            sectionTag:
              data.why_us.sectionTag ||
              data.why_us.section_tag ||
              DEFAULT_WHY_US.sectionTag,
            title: data.why_us.title || DEFAULT_WHY_US.title,
            items:
              Array.isArray(data.why_us.items) && data.why_us.items.length > 0
                ? data.why_us.items
                : DEFAULT_WHY_US.items,
          });
        }
        if (data.cta) {
          setCtaContent({
            heading: data.cta.heading || DEFAULT_CTA.heading,
            subheading: data.cta.subheading || DEFAULT_CTA.subheading,
            buttonText:
              data.cta.buttonText ||
              data.cta.button_text ||
              DEFAULT_CTA.buttonText,
            buttonLink:
              data.cta.buttonLink && data.cta.buttonLink !== "/contact"
                ? data.cta.buttonLink
                : data.cta.button_link && data.cta.button_link !== "/contact"
                  ? data.cta.button_link
                  : DEFAULT_CTA.buttonLink,
            phone: data.cta.phone || DEFAULT_CTA.phone,
            email: data.cta.email || DEFAULT_CTA.email,
          });
        }
        if (data.privacy_policy) {
          setPrivacyPolicy({
            title: data.privacy_policy.title || DEFAULT_PRIVACY_POLICY.title,
            subtitle:
              data.privacy_policy.subtitle !== undefined
                ? data.privacy_policy.subtitle
                : DEFAULT_PRIVACY_POLICY.subtitle,
            lastUpdated:
              data.privacy_policy.lastUpdated ||
              data.privacy_policy.last_updated ||
              DEFAULT_PRIVACY_POLICY.lastUpdated,
            content:
              data.privacy_policy.content ||
              (Array.isArray(data.privacy_policy.sections) &&
              data.privacy_policy.sections.length > 0
                ? data.privacy_policy.sections
                    .map((s) => `<h2>${s.heading}</h2>\n<p>${s.content}</p>`)
                    .join("\n\n")
                : DEFAULT_PRIVACY_POLICY.content),
          });
        }
        if (data.products_page) {
          setProductsPageContent({
            title: data.products_page.title || DEFAULT_PRODUCTS_PAGE.title,
            subtitle:
              data.products_page.subtitle !== undefined
                ? data.products_page.subtitle
                : DEFAULT_PRODUCTS_PAGE.subtitle,
            searchPlaceholder:
              data.products_page.searchPlaceholder ||
              data.products_page.search_placeholder ||
              DEFAULT_PRODUCTS_PAGE.searchPlaceholder,
            popularSearches:
              data.products_page.popularSearches ||
              data.products_page.popular_searches ||
              DEFAULT_PRODUCTS_PAGE.popularSearches,
          });
        }
        if (data.terms_of_use) {
          setTermsOfUse({
            title: data.terms_of_use.title || DEFAULT_TERMS_OF_USE.title,
            subtitle:
              data.terms_of_use.subtitle !== undefined
                ? data.terms_of_use.subtitle
                : DEFAULT_TERMS_OF_USE.subtitle,
            lastUpdated:
              data.terms_of_use.lastUpdated ||
              data.terms_of_use.last_updated ||
              DEFAULT_TERMS_OF_USE.lastUpdated,
            content:
              data.terms_of_use.content ||
              (Array.isArray(data.terms_of_use.sections) &&
              data.terms_of_use.sections.length > 0
                ? data.terms_of_use.sections
                    .map((s) => `<h2>${s.heading}</h2>\n<p>${s.content}</p>`)
                    .join("\n\n")
                : DEFAULT_TERMS_OF_USE.content),
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load site content from API:", err);
        showToast(
          "Using local default content (failed to reach CMS backend)",
          "error",
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveSection = async (sectionKey: ContentTab) => {
    if (!token) {
      showToast("Authentication required to save changes", "error");
      return;
    }

    setIsSaving(true);
    try {
      let contentToSave:
        | Record<string, unknown>
        | HeroContent
        | CompanyContent
        | WhyUsContent
        | CTAContent
        | LegalContent
        | ProductsPageContent = heroContent;
      let title = "";

      if (sectionKey === "hero") {
        contentToSave = heroContent;
        title = "Homepage Hero & Search";
      } else if (sectionKey === "products_page") {
        contentToSave = productsPageContent;
        title = "Product Catalogue Search";
      } else if (sectionKey === "company") {
        contentToSave = companyInfo;
        title = "Contact & Company Info";
      } else if (sectionKey === "why_us") {
        contentToSave = whyUsContent;
        title = "Why SA Healthcare";
      } else if (sectionKey === "cta") {
        contentToSave = ctaContent;
        title = "Call to Action Banner";
      } else if (sectionKey === "privacy_policy") {
        contentToSave = privacyPolicy;
        title = "Privacy Policy";
      } else if (sectionKey === "terms_of_use") {
        contentToSave = termsOfUse;
        title = "Terms of Use";
      }

      await contentApi.updateSection(token, sectionKey, {
        content: contentToSave,
        title,
      });

      showToast(
        `Saved ${title} successfully! Changes reflect on the live page.`,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save section changes";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!token) {
      showToast("Authentication required to save changes", "error");
      return;
    }

    setIsSaving(true);
    try {
      await contentApi.updateBatch(token, {
        hero: heroContent,
        products_page: productsPageContent,
        company: companyInfo,
        why_us: whyUsContent,
        cta: ctaContent,
        privacy_policy: privacyPolicy,
        terms_of_use: termsOfUse,
      });
      showToast(
        "All CMS sections saved successfully! Live site is up to date.",
      );
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save all CMS sections";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSection = async (sectionKey: ContentTab) => {
    if (!token) {
      showToast("Authentication required to reset", "error");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to reset "${sectionKey}" to initial platform defaults?`,
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await contentApi.resetSection(token, sectionKey);
      if (sectionKey === "hero" && result.hero) {
        setHeroContent({ ...DEFAULT_HERO, ...result.hero });
      } else if (sectionKey === "products_page" && result.products_page) {
        setProductsPageContent({
          ...DEFAULT_PRODUCTS_PAGE,
          ...result.products_page,
        });
      } else if (sectionKey === "company" && result.company) {
        setCompanyInfo({ ...DEFAULT_COMPANY, ...result.company });
      } else if (sectionKey === "why_us" && result.why_us) {
        setWhyUsContent({ ...DEFAULT_WHY_US, ...result.why_us });
      } else if (sectionKey === "cta" && result.cta) {
        setCtaContent({ ...DEFAULT_CTA, ...result.cta });
      } else if (sectionKey === "privacy_policy" && result.privacy_policy) {
        setPrivacyPolicy({
          ...DEFAULT_PRIVACY_POLICY,
          ...result.privacy_policy,
        });
      } else if (sectionKey === "terms_of_use" && result.terms_of_use) {
        setTermsOfUse({ ...DEFAULT_TERMS_OF_USE, ...result.terms_of_use });
      }
      showToast(`Reset ${sectionKey} to default configuration!`);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to reset section";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const addPopularSearchTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    const currentTags = heroContent.popularSearches || [];
    if (!currentTags.includes(trimmed)) {
      setHeroContent({
        ...heroContent,
        popularSearches: [...currentTags, trimmed],
      });
    }
    setNewTagInput("");
  };

  const removePopularSearchTag = (tagToRemove: string) => {
    const currentTags = heroContent.popularSearches || [];
    setHeroContent({
      ...heroContent,
      popularSearches: currentTags.filter((t) => t !== tagToRemove),
    });
  };

  const addProductPopularSearchTag = () => {
    const trimmed = newProductTagInput.trim();
    if (!trimmed) return;
    const currentTags = productsPageContent.popularSearches || [];
    if (!currentTags.includes(trimmed)) {
      setProductsPageContent({
        ...productsPageContent,
        popularSearches: [...currentTags, trimmed],
      });
    }
    setNewProductTagInput("");
  };

  const removeProductPopularSearchTag = (tagToRemove: string) => {
    const currentTags = productsPageContent.popularSearches || [];
    setProductsPageContent({
      ...productsPageContent,
      popularSearches: currentTags.filter((t) => t !== tagToRemove),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-12">
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-xs">
          <div className="w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-navy">
            Loading CMS site content from backend...
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Retrieving marketing copy, hero parameters &amp; contact details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-100 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-scale-in border ${
            toastMessage.type === "error"
              ? "bg-rose-600 border-rose-500/80 shadow-rose-950/20"
              : "bg-emerald-600 border-emerald-500/80 shadow-emerald-950/20"
          }`}
        >
          <span className="material-symbols-outlined text-white text-xl!">
            {toastMessage.type === "error" ? "error" : "check_circle"}
          </span>
          <span className="text-xs sm:text-sm font-semibold tracking-wide">
            {toastMessage.text}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Site Content &amp; CMS
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage marketing copy, hero slogans, popular searches, value props,
            and corporate contact details.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href={
              activeTab === "privacy_policy"
                ? "/privacy"
                : activeTab === "terms_of_use"
                  ? "/terms"
                  : activeTab === "company"
                    ? "/contact"
                    : activeTab === "products_page"
                      ? "/products"
                      : "/home"
            }
            target="_blank"
            className="bg-slate-100 hover:bg-slate-200 text-navy font-bold px-3.5 py-2.5 rounded-xl transition-colors text-xs sm:text-sm flex items-center gap-1.5 border border-gray-200"
          >
            <span>
              {activeTab === "privacy_policy"
                ? "Live Privacy Page"
                : activeTab === "terms_of_use"
                  ? "Live Terms Page"
                  : activeTab === "company"
                    ? "Live Contact Page"
                    : activeTab === "products_page"
                      ? "Live Products Page"
                      : "Live Homepage"}
            </span>
            <span className="material-symbols-outlined text-sm!">
              open_in_new
            </span>
          </Link>

          {canWriteContent && (
            <button
              onClick={() => handleSaveSection(activeTab)}
              disabled={isSaving}
              className="bg-gold text-navy font-bold px-4 py-2.5 rounded-xl hover:bg-gold-bright transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg!">
                {isSaving ? "sync" : "save"}
              </span>
              <span>{isSaving ? "Saving..." : "Save Current Section"}</span>
            </button>
          )}
        </div>
      </div>

      {!canWriteContent && (
        <div className="bg-amber-50/90 border border-amber-200/90 text-amber-900 rounded-2xl p-4 flex items-center gap-3 text-xs leading-relaxed">
          <span className="material-symbols-outlined text-amber-600 text-xl! shrink-0">
            visibility
          </span>
          <div>
            <p className="font-bold text-amber-950">Read-Only CMS View</p>
            <p className="text-amber-800/90 mt-0.5">
              Your account has read-only access to site content.
            </p>
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("hero")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "hero"
                ? "bg-navy text-white shadow-xs"
                : "text-gray-600 hover:text-navy hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-base!">
              view_headline
            </span>
            <span>Homepage Hero &amp; Search</span>
          </button>

          <button
            onClick={() => setActiveTab("products_page")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "products_page"
                ? "bg-navy text-white shadow-xs"
                : "text-gray-600 hover:text-navy hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-base!">
              storefront
            </span>
            <span>Product Catalogue Search</span>
          </button>

          <button
            onClick={() => setActiveTab("company")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "company"
                ? "bg-navy text-white shadow-xs"
                : "text-gray-600 hover:text-navy hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-base!">
              apartment
            </span>
            <span>Contact &amp; Company Info</span>
          </button>

          <button
            onClick={() => setActiveTab("why_us")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "why_us"
                ? "bg-navy text-white shadow-xs"
                : "text-gray-600 hover:text-navy hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-base!">
              verified
            </span>
            <span>Why SA Healthcare</span>
          </button>

          <button
            onClick={() => setActiveTab("cta")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "cta"
                ? "bg-navy text-white shadow-xs"
                : "text-gray-600 hover:text-navy hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-base!">
              campaign
            </span>
            <span>Quotation Banner &amp; CTA</span>
          </button>

          <button
            onClick={() => setActiveTab("privacy_policy")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "privacy_policy"
                ? "bg-navy text-white shadow-xs"
                : "text-gray-600 hover:text-navy hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-base!">policy</span>
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab("terms_of_use")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "terms_of_use"
                ? "bg-navy text-white shadow-xs"
                : "text-gray-600 hover:text-navy hover:bg-white"
            }`}
          >
            <span className="material-symbols-outlined text-base!">gavel</span>
            <span>Terms of Use</span>
          </button>
        </div>

        {canWriteContent && (
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base!">save</span>
            <span>Save All Sections</span>
          </button>
        )}
      </div>

      {/* Tab 1: Hero Section */}
      {activeTab === "hero" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-navy">
                  Homepage Hero Typography &amp; Search Configuration
                </h2>
                <p className="text-xs text-gray-500">
                  Configure the primary hero headline, slogan, search bar
                  visibility, and quick search tags on /home.
                </p>
              </div>
              {canWriteContent && (
                <button
                  type="button"
                  onClick={() => handleResetSection("hero")}
                  className="text-xs text-gray-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm!">
                    restart_alt
                  </span>
                  Reset to Default
                </button>
              )}
            </div>

            <fieldset
              disabled={!canWriteContent}
              className="space-y-6 disabled:opacity-90"
            >
              {/* Headline fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Headline Line 1
                  </label>
                  <input
                    type="text"
                    value={heroContent.headlinePart1}
                    onChange={(e) =>
                      setHeroContent({
                        ...heroContent,
                        headlinePart1: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-bold"
                    placeholder="e.g. Healthcare"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Headline Line 2
                  </label>
                  <input
                    type="text"
                    value={heroContent.headlinePart2}
                    onChange={(e) =>
                      setHeroContent({
                        ...heroContent,
                        headlinePart2: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-bold"
                    placeholder="e.g. without"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Accent Word (Cyan / Light Blue)
                  </label>
                  <input
                    type="text"
                    value={heroContent.headlineAccent}
                    onChange={(e) =>
                      setHeroContent({
                        ...heroContent,
                        headlineAccent: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-blue-600 font-bold"
                    placeholder="e.g. limits."
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Hero Paragraph Subtitle
                </label>
                <textarea
                  rows={3}
                  value={heroContent.subheading}
                  onChange={(e) =>
                    setHeroContent({
                      ...heroContent,
                      subheading: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy leading-relaxed"
                  placeholder="Description copy..."
                />
              </div>

              {/* Search Bar Visibility & Placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-gray-200">
                  <div>
                    <span className="font-bold text-navy text-sm block">
                      Show Hero Search Bar
                    </span>
                    <span className="text-xs text-gray-500">
                      Toggle whether the catalogue search input is displayed in
                      the hero.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={heroContent.showSearchBar}
                      onChange={(e) =>
                        setHeroContent({
                          ...heroContent,
                          showSearchBar: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Search Bar Placeholder
                  </label>
                  <input
                    type="text"
                    value={heroContent.searchPlaceholder || ""}
                    onChange={(e) =>
                      setHeroContent({
                        ...heroContent,
                        searchPlaceholder: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                    placeholder="Placeholder for catalogue search..."
                  />
                </div>
              </div>

              {/* Popular Searches Chips Manager */}
              <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Popular Search Terms (Quick Filter Chips)
                </label>
                <p className="text-xs text-gray-500">
                  These tags appear underneath the search bar and allow visitors
                  to perform instant searches with one click.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(heroContent.popularSearches || []).length === 0 && (
                    <p className="text-xs text-gray-400 italic py-1">
                      No search tags configured. &ldquo;Popular searches:&rdquo;
                      will be hidden on the hero banner.
                    </p>
                  )}
                  {(heroContent.popularSearches || []).map((term) => (
                    <span
                      key={term}
                      className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-navy px-3 py-1 rounded-full text-xs font-semibold shadow-2xs"
                    >
                      <span>{term}</span>
                      {canWriteContent && (
                        <button
                          type="button"
                          onClick={() => removePopularSearchTag(term)}
                          className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove term"
                        >
                          <span className="material-symbols-outlined text-sm! leading-none">
                            close
                          </span>
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {canWriteContent && (
                  <div className="flex items-center gap-2 pt-2 max-w-md">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addPopularSearchTag();
                        }
                      }}
                      placeholder="Add search term, e.g. Defibrillator"
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-navy"
                    />
                    <button
                      type="button"
                      onClick={addPopularSearchTag}
                      className="bg-navy hover:bg-navy-light text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Add Tag
                    </button>
                  </div>
                )}
              </div>

              {/* Right Banner Badge Typography */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Pillars Slogan (Upper Right Slogan)
                  </label>
                  <input
                    type="text"
                    value={heroContent.badgeTitle || ""}
                    onChange={(e) =>
                      setHeroContent({
                        ...heroContent,
                        badgeTitle: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-medium"
                    placeholder="e.g. TRUST • ACCESS • INNOVATION • IMPACT"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tagline Statement (Lower Right Slogan)
                  </label>
                  <input
                    type="text"
                    value={heroContent.badgeTagline || ""}
                    onChange={(e) =>
                      setHeroContent({
                        ...heroContent,
                        badgeTagline: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-medium"
                    placeholder="e.g. A HEALTHIER TOMORROW TOGETHER."
                  />
                </div>
              </div>

              {canWriteContent && (
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleSaveSection("hero")}
                    disabled={isSaving}
                    className="bg-navy text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-light text-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base!">
                      save
                    </span>
                    <span>{isSaving ? "Saving..." : "Save Hero Changes"}</span>
                  </button>
                </div>
              )}
            </fieldset>
          </div>

          {/* Live Hero Preview Card */}
          <div className="bg-navy rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-navy-light/40">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm!">
                  visibility
                </span>
                Live Preview (Hero Section)
              </span>
              <span className="text-[10px] text-gray-400">
                Updates as you type
              </span>
            </div>

            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-5xl font-black mb-3 leading-tight tracking-tight">
                {heroContent.headlinePart1} <br />
                {heroContent.headlinePart2}{" "}
                <span className="text-light-blue">
                  {heroContent.headlineAccent}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed mb-6">
                {heroContent.subheading}
              </p>

              {heroContent.showSearchBar && (
                <div className="bg-white rounded-full p-1 flex items-center shadow-lg max-w-lg mb-5">
                  <span className="material-symbols-outlined text-navy ml-3 mr-2 text-lg!">
                    search
                  </span>
                  <input
                    type="text"
                    disabled
                    placeholder={heroContent.searchPlaceholder}
                    className="flex-1 bg-transparent text-navy text-xs outline-none cursor-not-allowed"
                  />
                  <span className="bg-gold text-navy font-bold rounded-full px-4 py-1.5 text-xs shrink-0">
                    Search
                  </span>
                </div>
              )}

              {(heroContent.popularSearches || []).filter(
                (t) => t && t.trim().length > 0,
              ).length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] text-gray-300 font-medium mr-1">
                    Popular searches:
                  </span>
                  {(heroContent.popularSearches || [])
                    .filter((t) => t && t.trim().length > 0)
                    .map((t) => (
                      <span
                        key={t}
                        className="border border-white/30 text-white rounded-full px-3 py-0.5 text-[10px] backdrop-blur-xs font-medium"
                      >
                        {t}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Product Catalogue Search & Banner */}
      {activeTab === "products_page" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-navy">
                  Product Catalogue Banner &amp; Search Keywords
                </h2>
                <p className="text-xs text-gray-500">
                  Manage the header copy, search placeholder, and distinct quick
                  popular search chips displayed on the Product Catalogue page
                  (/products).
                </p>
              </div>
              {canWriteContent && (
                <button
                  type="button"
                  onClick={() => handleResetSection("products_page")}
                  className="text-xs text-gray-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm!">
                    restart_alt
                  </span>
                  Reset to Default
                </button>
              )}
            </div>

            <fieldset
              disabled={!canWriteContent}
              className="space-y-6 disabled:opacity-90"
            >
              {/* Banner Copy Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Catalogue Main Title
                  </label>
                  <input
                    type="text"
                    value={productsPageContent.title || ""}
                    onChange={(e) =>
                      setProductsPageContent({
                        ...productsPageContent,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy font-semibold"
                    placeholder="e.g. Browse the Catalogue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Search Bar Placeholder
                  </label>
                  <input
                    type="text"
                    value={productsPageContent.searchPlaceholder || ""}
                    onChange={(e) =>
                      setProductsPageContent({
                        ...productsPageContent,
                        searchPlaceholder: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                    placeholder="e.g. Search by product, model number, manufacturer..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Catalogue Subtitle Description
                  </label>
                  <input
                    type="text"
                    value={productsPageContent.subtitle || ""}
                    onChange={(e) =>
                      setProductsPageContent({
                        ...productsPageContent,
                        subtitle: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-navy"
                    placeholder="e.g. Explore our range of medical products from trusted global manufacturers."
                  />
                </div>
              </div>

              {/* Catalogue Popular Searches Chips Manager */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                      Catalogue Popular Search Terms (Filter Chips)
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      These keywords appear underneath the search bar on
                      /products. Clicking a chip executes instant filtering.
                    </p>
                  </div>
                  {canWriteContent &&
                    (productsPageContent.popularSearches || []).length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setProductsPageContent({
                            ...productsPageContent,
                            popularSearches: [],
                          })
                        }
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold self-start sm:self-auto cursor-pointer"
                      >
                        Clear All Tags
                      </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {(productsPageContent.popularSearches || []).length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 w-full flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-600 text-base!">
                          info
                        </span>
                        <span>
                          No search tags configured. The &ldquo;Popular
                          searches:&rdquo; line will be completely hidden on the
                          catalogue page.
                        </span>
                      </div>
                      {canWriteContent && (
                        <button
                          type="button"
                          onClick={() =>
                            setProductsPageContent({
                              ...productsPageContent,
                              popularSearches: [
                                ...DEFAULT_PRODUCTS_PAGE.popularSearches!,
                              ],
                            })
                          }
                          className="text-xs font-bold text-amber-900 underline hover:no-underline shrink-0 cursor-pointer"
                        >
                          Restore Defaults
                        </button>
                      )}
                    </div>
                  ) : (
                    (productsPageContent.popularSearches || []).map((term) => (
                      <span
                        key={term}
                        className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-navy px-3 py-1 rounded-full text-xs font-semibold shadow-2xs"
                      >
                        <span>{term}</span>
                        {canWriteContent && (
                          <button
                            type="button"
                            onClick={() => removeProductPopularSearchTag(term)}
                            className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove term"
                          >
                            <span className="material-symbols-outlined text-sm! leading-none">
                              close
                            </span>
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {canWriteContent && (
                  <div className="flex items-center gap-2 pt-2 max-w-md">
                    <input
                      type="text"
                      value={newProductTagInput}
                      onChange={(e) => setNewProductTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addProductPopularSearchTag();
                        }
                      }}
                      placeholder="Add catalogue search term, e.g. Defibrillator"
                      className="flex-1 px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-navy"
                    />
                    <button
                      type="button"
                      onClick={addProductPopularSearchTag}
                      className="bg-navy hover:bg-navy-light text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Add Tag
                    </button>
                  </div>
                )}
              </div>

              {canWriteContent && (
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleSaveSection("products_page")}
                    disabled={isSaving}
                    className="bg-navy text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-light text-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base!">
                      save
                    </span>
                    <span>
                      {isSaving ? "Saving..." : "Save Catalogue Settings"}
                    </span>
                  </button>
                </div>
              )}
            </fieldset>
          </div>

          {/* Live Catalogue Banner Preview Card */}
          <div className="bg-navy rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-navy-light/40">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm!">
                  visibility
                </span>
                Live Preview (Product Catalogue Banner)
              </span>
              <span className="text-[10px] text-gray-400">
                Previewing /products banner
              </span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1.5 tracking-tight text-white">
                  {productsPageContent.title || "Browse the Catalogue"}
                </h1>
                <p className="text-gray-300 text-xs sm:text-sm max-w-xl">
                  {productsPageContent.subtitle ||
                    "Explore our range of medical products from trusted global manufacturers."}
                </p>
              </div>

              {/* Preview Search Bar */}
              <div className="w-full max-w-md">
                <div className="bg-white rounded-full p-1.5 flex items-center shadow-lg border border-gray-200">
                  <span className="material-symbols-outlined text-gray-400 ml-3 mr-2 text-base!">
                    search
                  </span>
                  <input
                    type="text"
                    disabled
                    placeholder={
                      productsPageContent.searchPlaceholder ||
                      "Search by product, model number, manufacturer..."
                    }
                    className="flex-1 bg-transparent text-navy text-xs outline-none cursor-not-allowed"
                  />
                  <span className="bg-gold text-navy font-bold px-4 py-1.5 rounded-full text-xs shrink-0 flex items-center gap-1">
                    <span>Search</span>
                    <span className="material-symbols-outlined text-xs!">
                      arrow_forward
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Popular Searches Pills */}
            {(productsPageContent.popularSearches || []).filter(
              (t) => t && t.trim().length > 0,
            ).length > 0 ? (
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs pt-4 border-t border-white/10">
                <span className="text-gray-300 font-semibold mr-1">
                  Popular searches:
                </span>
                {(productsPageContent.popularSearches || [])
                  .filter((t) => t && t.trim().length > 0)
                  .map((keyword) => (
                    <span
                      key={keyword}
                      className="px-3 py-1 rounded-full border bg-navy-light/60 text-gray-200 border-white/20 text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-400 italic">
                (No popular search tags configured &mdash; the &ldquo;Popular
                searches:&rdquo; row is hidden on the live page)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Company & Contact Info */}
      {activeTab === "company" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy">
                Corporate &amp; Contact Details
              </h2>
              <p className="text-xs text-gray-500">
                Contact information displayed across the site header, footer,
                quotation modal, and contact page.
              </p>
            </div>
            {canWriteContent && (
              <button
                type="button"
                onClick={() => handleResetSection("company")}
                className="text-xs text-gray-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm!">
                  restart_alt
                </span>
                Reset to Default
              </button>
            )}
          </div>

          <fieldset
            disabled={!canWriteContent}
            className="space-y-6 disabled:opacity-90"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Company Legal Name
                </label>
                <input
                  type="text"
                  value={companyInfo.companyName}
                  onChange={(e) =>
                    setCompanyInfo({
                      ...companyInfo,
                      companyName: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Primary Phone Number
                </label>
                <input
                  type="text"
                  value={companyInfo.phone}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Toll-Free Phone Number
                </label>
                <input
                  type="text"
                  value={companyInfo.tollFree || ""}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, tollFree: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-medium"
                  placeholder="e.g. 0800 123 456"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  General Support Email
                </label>
                <input
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Sales &amp; Quotations Email
                </label>
                <input
                  type="email"
                  value={companyInfo.salesEmail || ""}
                  onChange={(e) =>
                    setCompanyInfo({
                      ...companyInfo,
                      salesEmail: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  value={companyInfo.hours}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, hours: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Physical Office Address
              </label>
              <input
                type="text"
                value={companyInfo.physicalAddress}
                onChange={(e) =>
                  setCompanyInfo({
                    ...companyInfo,
                    physicalAddress: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
              />
            </div>

            {canWriteContent && (
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleSaveSection("company")}
                  disabled={isSaving}
                  className="bg-navy text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-light text-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base!">
                    save
                  </span>
                  <span>{isSaving ? "Saving..." : "Save Company Info"}</span>
                </button>
              </div>
            )}
          </fieldset>
        </div>
      )}

      {/* Tab 3: Why SA Healthcare */}
      {activeTab === "why_us" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy">
                Value Propositions &amp; Why SA Healthcare
              </h2>
              <p className="text-xs text-gray-500">
                Edit the three core value pillars displayed prominently on the
                homepage.
              </p>
            </div>
            {canWriteContent && (
              <button
                type="button"
                onClick={() => handleResetSection("why_us")}
                className="text-xs text-gray-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm!">
                  restart_alt
                </span>
                Reset to Default
              </button>
            )}
          </div>

          <fieldset
            disabled={!canWriteContent}
            className="space-y-6 disabled:opacity-90"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Section Tag / Badge
                </label>
                <input
                  type="text"
                  value={whyUsContent.sectionTag || ""}
                  onChange={(e) =>
                    setWhyUsContent({
                      ...whyUsContent,
                      sectionTag: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Section Headline
                </label>
                <input
                  type="text"
                  value={whyUsContent.title || ""}
                  onChange={(e) =>
                    setWhyUsContent({ ...whyUsContent, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-bold"
                />
              </div>
            </div>

            {/* Cards list */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Feature Cards
              </h3>
              {whyUsContent.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Icon Name
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-2xl! text-navy">
                        {item.icon}
                      </span>
                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => {
                          const newItems = [...whyUsContent.items];
                          newItems[idx].icon = e.target.value;
                          setWhyUsContent({ ...whyUsContent, items: newItems });
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none text-navy font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Card Title
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const newItems = [...whyUsContent.items];
                        newItems[idx].title = e.target.value;
                        setWhyUsContent({ ...whyUsContent, items: newItems });
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none text-navy font-bold"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...whyUsContent.items];
                        newItems[idx].description = e.target.value;
                        setWhyUsContent({ ...whyUsContent, items: newItems });
                      }}
                      className="w-full px-3.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg outline-none text-navy"
                    />
                  </div>
                </div>
              ))}
            </div>

            {canWriteContent && (
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleSaveSection("why_us")}
                  disabled={isSaving}
                  className="bg-navy text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-light text-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base!">
                    save
                  </span>
                  <span>
                    {isSaving ? "Saving..." : "Save Why SA Healthcare"}
                  </span>
                </button>
              </div>
            )}
          </fieldset>
        </div>
      )}

      {/* Tab 4: Call to Action Banner */}
      {activeTab === "cta" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy">
                Quotation Call to Action Banner
              </h2>
              <p className="text-xs text-gray-500">
                Configure the quotation banner at the bottom of the homepage.
              </p>
            </div>
            {canWriteContent && (
              <button
                type="button"
                onClick={() => handleResetSection("cta")}
                className="text-xs text-gray-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm!">
                  restart_alt
                </span>
                Reset to Default
              </button>
            )}
          </div>

          <fieldset
            disabled={!canWriteContent}
            className="space-y-6 disabled:opacity-90"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Banner Heading
                </label>
                <input
                  type="text"
                  value={ctaContent.heading}
                  onChange={(e) =>
                    setCtaContent({ ...ctaContent, heading: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={ctaContent.buttonText || ""}
                  onChange={(e) =>
                    setCtaContent({ ...ctaContent, buttonText: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Banner Subheading
              </label>
              <textarea
                rows={2}
                value={ctaContent.subheading}
                onChange={(e) =>
                  setCtaContent({ ...ctaContent, subheading: e.target.value })
                }
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Button Link URL
                </label>
                <input
                  type="text"
                  value={ctaContent.buttonLink || ""}
                  onChange={(e) =>
                    setCtaContent({ ...ctaContent, buttonLink: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Direct Contact Phone
                </label>
                <input
                  type="text"
                  value={ctaContent.phone || ""}
                  onChange={(e) =>
                    setCtaContent({ ...ctaContent, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Direct Contact Email
                </label>
                <input
                  type="email"
                  value={ctaContent.email || ""}
                  onChange={(e) =>
                    setCtaContent({ ...ctaContent, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
                />
              </div>
            </div>

            {canWriteContent && (
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleSaveSection("cta")}
                  disabled={isSaving}
                  className="bg-navy text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-light text-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base!">
                    save
                  </span>
                  <span>{isSaving ? "Saving..." : "Save CTA Changes"}</span>
                </button>
              </div>
            )}
          </fieldset>
        </div>
      )}

      {/* Tab 5: Privacy Policy */}
      {activeTab === "privacy_policy" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-navy">
                  Privacy Policy &amp; POPIA Compliance
                </h2>
                <p className="text-xs text-gray-500">
                  Manage the document title, subtitle, effective date, and full
                  rich text policy content displayed on /privacy.
                </p>
              </div>
              {canWriteContent && (
                <button
                  type="button"
                  onClick={() => handleResetSection("privacy_policy")}
                  className="text-xs text-gray-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm!">
                    restart_alt
                  </span>
                  Reset to Default
                </button>
              )}
            </div>

            <fieldset
              disabled={!canWriteContent}
              className="space-y-6 disabled:opacity-90"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={privacyPolicy.title}
                    onChange={(e) =>
                      setPrivacyPolicy({
                        ...privacyPolicy,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Last Updated / Effective Date
                  </label>
                  <input
                    type="text"
                    value={privacyPolicy.lastUpdated || ""}
                    onChange={(e) =>
                      setPrivacyPolicy({
                        ...privacyPolicy,
                        lastUpdated: e.target.value,
                      })
                    }
                    placeholder="e.g. October 2026"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Policy Subtitle / Summary
                </label>
                <textarea
                  rows={2}
                  value={privacyPolicy.subtitle || ""}
                  onChange={(e) =>
                    setPrivacyPolicy({
                      ...privacyPolicy,
                      subtitle: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Full Policy Content
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Single field for all policy clauses, contact info &amp;
                    terms
                  </span>
                </div>
                <RichTextEditor
                  value={privacyPolicy.content}
                  onChange={(content) =>
                    setPrivacyPolicy({ ...privacyPolicy, content })
                  }
                  placeholder="Compose or paste full privacy policy content..."
                  readOnly={!canWriteContent}
                />
              </div>

              {canWriteContent && (
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleSaveSection("privacy_policy")}
                    disabled={isSaving}
                    className="bg-navy text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-light text-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base!">
                      save
                    </span>
                    <span>
                      {isSaving ? "Saving..." : "Save Privacy Policy"}
                    </span>
                  </button>
                </div>
              )}
            </fieldset>
          </div>
        </div>
      )}

      {/* Tab 6: Terms of Use */}
      {activeTab === "terms_of_use" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-navy">
                  Terms of Use &amp; Catalogue Conditions
                </h2>
                <p className="text-xs text-gray-500">
                  Manage the document title, subtitle, effective date, and full
                  rich text terms displayed on /terms.
                </p>
              </div>
              {canWriteContent && (
                <button
                  type="button"
                  onClick={() => handleResetSection("terms_of_use")}
                  className="text-xs text-gray-400 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm!">
                    restart_alt
                  </span>
                  Reset to Default
                </button>
              )}
            </div>

            <fieldset
              disabled={!canWriteContent}
              className="space-y-6 disabled:opacity-90"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={termsOfUse.title}
                    onChange={(e) =>
                      setTermsOfUse({ ...termsOfUse, title: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Last Updated / Effective Date
                  </label>
                  <input
                    type="text"
                    value={termsOfUse.lastUpdated || ""}
                    onChange={(e) =>
                      setTermsOfUse({
                        ...termsOfUse,
                        lastUpdated: e.target.value,
                      })
                    }
                    placeholder="e.g. October 2026"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Terms Subtitle / Summary
                </label>
                <textarea
                  rows={2}
                  value={termsOfUse.subtitle || ""}
                  onChange={(e) =>
                    setTermsOfUse({ ...termsOfUse, subtitle: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-navy"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Full Terms Content (Rich Text)
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Single field for all catalogue terms, warranty &amp;
                    liabilities
                  </span>
                </div>
                <RichTextEditor
                  value={termsOfUse.content}
                  onChange={(content) =>
                    setTermsOfUse({ ...termsOfUse, content })
                  }
                  placeholder="Compose or paste full terms of use content..."
                  readOnly={!canWriteContent}
                />
              </div>

              {canWriteContent && (
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleSaveSection("terms_of_use")}
                    disabled={isSaving}
                    className="bg-navy text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-light text-xs transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base!">
                      save
                    </span>
                    <span>{isSaving ? "Saving..." : "Save Terms of Use"}</span>
                  </button>
                </div>
              )}
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}
