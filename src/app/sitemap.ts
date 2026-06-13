import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";

const publicRoutes = ["", "/about", "/blog", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    return publicRoutes.map((route) => ({
        url: `${siteUrl}${route}`,
        lastModified,
        changeFrequency: route === "" ? "weekly" : "monthly",
        priority: route === "" ? 1 : 0.6,
    }));
}
