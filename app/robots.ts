import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://interview-ai.vercel.app";

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin/", "/hrd/"],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
