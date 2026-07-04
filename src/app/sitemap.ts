import type { MetadataRoute } from "next";
import { site, caseStudies } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    ...caseStudies.map((c) => ({
      url: `${site.url}/work/${c.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    { url: `${site.url}/colophon`, changeFrequency: "yearly", priority: 0.4 },
  ];
}
