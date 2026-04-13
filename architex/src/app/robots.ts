import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/sign-in", "/sign-up", "/offline", "/team"],
    },
    sitemap: "https://architex.dev/sitemap.xml",
  };
}
