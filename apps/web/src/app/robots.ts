import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/register", "/dashboard", "/dashboard/"]
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`
  };
}

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, "");
}
