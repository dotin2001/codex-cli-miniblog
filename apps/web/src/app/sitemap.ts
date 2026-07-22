import type { MetadataRoute } from "next";

import { getBlogs } from "@/lib/api/blogs";
import { routes } from "@/lib/routes";

const BLOGS_PER_PAGE = 50;
const DEFAULT_SITE_URL = "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = getStaticSitemapEntries();

  try {
    const blogEntries = await getPublishedBlogEntries();

    return [...staticEntries, ...blogEntries];
  } catch {
    return staticEntries;
  }
}

async function getPublishedBlogEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const { blogs, pagination } = await getBlogs({
      page,
      perPage: BLOGS_PER_PAGE
    });

    entries.push(
      ...blogs.map((blog) => ({
        lastModified: blog.updatedAt || blog.createdAt,
        url: getAbsoluteUrl(routes.blog(blog.slug))
      }))
    );

    totalPages = pagination.totalPages;
    page += 1;
  }

  return entries;
}

function getStaticSitemapEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: getAbsoluteUrl(routes.home)
    },
    {
      url: getAbsoluteUrl(routes.blogs)
    }
  ];
}

function getAbsoluteUrl(path: string): string {
  return `${getSiteUrl()}${path}`;
}

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, "");
}
