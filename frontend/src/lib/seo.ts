/**
 * SEO & Canonical URL Configuration Utilities
 * All site URLs dynamically respect NEXT_PUBLIC_SITE_URL configured in .env.
 */

export function getSiteUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return rawUrl.trim().replace(/\/+$/, "");
}

export function getApiUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return rawUrl.trim().replace(/\/+$/, "");
}

export function getCanonicalUrl(path: string = ""): string {
  const siteUrl = getSiteUrl();
  if (!path || path === "/") return siteUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${cleanPath}`;
}

export const COMMON_SEO_KEYWORDS = [
  "medical equipment",
  "medical devices South Africa",
  "hospital equipment and supplies",
  "ICU patient monitors",
  "patient monitoring systems",
  "vital signs monitors",
  "hospital beds",
  "operating theatre equipment",
  "surgical instruments",
  "autoclaves and sterilisers",
  "emergency defibrillators",
  "AED resuscitation units",
  "emergency ventilators",
  "medical disposables",
  "laboratory centrifuges",
  "veterinary medical devices",
  "mobility aids and wheelchairs",
  "medical suction units",
  "medical equipment supplier",
  "SA Healthcare",
  "Mindray",
  "Contec",
  "Philips",
  "Dräger",
  "CA-MI",
];
