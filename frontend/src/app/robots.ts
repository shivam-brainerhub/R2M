import { getSiteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/media/", "/images/", "/login", "/signup"],
        disallow: [
          "/portal/",
          "/admin/",
          "/profile/",
          "/api/",
          "/quote",
          "/compare",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/media/", "/images/", "/login", "/signup"],
        disallow: [
          "/portal/",
          "/admin/",
          "/profile/",
          "/api/",
          "/quote",
          "/compare",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/media/", "/images/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ""),
  };
}
