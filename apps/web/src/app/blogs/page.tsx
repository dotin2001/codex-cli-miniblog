import Link from "next/link";
import type { Metadata } from "next";

import { BlogTitleSearchForm } from "./blog-title-search-form";
import { CreateBlogCta } from "./create-blog-cta";
import { BlogTagList } from "@/components/blog-tag-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApiRequestError, getBlogs } from "@/lib/api/blogs";
import type { Blog, Pagination } from "@/lib/api/blogs";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Published Posts",
  description:
    "Browse the latest published posts and stories shared by MiniBlog authors."
};

type BlogListState =
  | {
      blogs: Blog[];
      pagination: Pagination;
      status: "success";
    }
  | {
      message: string;
      status: "error";
    };

type BlogsPageProps = {
  searchParams?: Promise<{
    tag?: string | string[];
    title?: string | string[];
  }>;
};

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const resolvedSearchParams = await searchParams;
  const activeTag = getActiveTag(resolvedSearchParams);
  const activeTitle = getActiveTitle(resolvedSearchParams);
  const state = await loadBlogs(activeTag, activeTitle);

  return (
    <BlogShell>
      {state.status === "success" ? (
        <BlogList
          activeTag={activeTag}
          activeTitle={activeTitle}
          blogs={state.blogs}
          pagination={state.pagination}
        />
      ) : (
        <section className="py-12 sm:py-16">
          <ErrorState message={state.message} />
        </section>
      )}
    </BlogShell>
  );
}

async function loadBlogs(
  activeTag: string | null,
  activeTitle: string | null,
): Promise<BlogListState> {
  try {
    const { blogs, pagination } = await getBlogs({
      page: 1,
      perPage: 10,
      ...(activeTag ? { tag: activeTag } : {}),
      ...(activeTitle ? { title: activeTitle } : {}),
    });

    return { blogs, pagination, status: "success" };
  } catch (error) {
    return { message: getErrorMessage(error), status: "error" };
  }
}

function BlogShell({ children }: { children: React.ReactNode }) {
  return (
    <main className={ui.pageGradient}>
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link
            href={routes.blogs}
            className={ui.brand}
          >
            MiniBlog
          </Link>
          <nav aria-label="Blog navigation" className="flex flex-wrap items-center justify-end gap-3">
            <ThemeToggle />
            <CreateBlogCta />
            <Link
              className={`${ui.secondaryButton} min-h-10 px-4`}
              href={routes.dashboard}
            >
              Account
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}

function BlogList({
  activeTag,
  activeTitle,
  blogs,
  pagination,
}: {
  activeTag: string | null;
  activeTitle: string | null;
  blogs: Blog[];
  pagination: Pagination;
}) {
  return (
    <section className="py-12 sm:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className={ui.eyebrow}>
            Published posts
          </p>
          <h1 className={`mt-4 text-balance text-4xl sm:text-5xl ${ui.title}`}>
            {getListHeading(activeTag, activeTitle)}
          </h1>
          <p className={`mt-5 max-w-xl text-base leading-8 sm:text-lg ${ui.text}`}>
            {getListDescription(activeTag, activeTitle)}
          </p>
        </div>
        <p className={`text-sm font-semibold ${ui.muted}`}>
          {pagination.total} {pagination.total === 1 ? "post" : "posts"}
        </p>
      </div>

      <BlogTitleSearchForm activeTag={activeTag} activeTitle={activeTitle} />

      {blogs.length > 0 ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {blogs.map((blog) => (
            <BlogCard blog={blog} key={blog.id} />
          ))}
        </div>
      ) : (
        <EmptyState activeTag={activeTag} activeTitle={activeTitle} />
      )}
    </section>
  );
}

function BlogCard({ blog }: { blog: Blog }) {
  return (
    <article className={`flex h-full flex-col p-6 ${ui.surface}`}>
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold ${ui.muted}`}>
        <span>{blog.author?.name ?? "Unknown author"}</span>
        <span aria-hidden="true" className="text-purple-300 dark:text-purple-500">
          /
        </span>
        <time dateTime={blog.createdAt}>{formatDate(blog.createdAt)}</time>
      </div>
      <h2 className={`mt-4 text-2xl ${ui.title}`}>
        <Link
          className="transition hover:text-purpleInk dark:hover:text-purple-200"
          href={routes.blog(blog.slug)}
        >
          {blog.title}
        </Link>
      </h2>
      <p className={`mt-4 line-clamp-3 flex-1 text-base leading-7 ${ui.text}`}>
        {blog.excerpt ?? "No excerpt available."}
      </p>
      <BlogTagList className="mt-5" linked tags={blog.tags} />
      <Link
        className={`mt-6 min-h-10 w-fit px-4 ${ui.primaryButton}`}
        href={routes.blog(blog.slug)}
      >
        Read post
      </Link>
    </article>
  );
}

function EmptyState({
  activeTag,
  activeTitle,
}: {
  activeTag: string | null;
  activeTitle: string | null;
}) {
  const hasFilters = Boolean(activeTag || activeTitle);

  return (
    <div className={`mt-10 p-8 text-center ${ui.surface}`}>
      <p className={ui.eyebrow}>
        {hasFilters ? "No matches" : "No posts yet"}
      </p>
      <h2 className={`mt-3 text-2xl ${ui.title}`}>
        {activeTitle
          ? `No published posts matched "${activeTitle}".`
          : "Published blogs will appear here."}
      </h2>
      <p className={`mx-auto mt-3 max-w-lg text-base leading-7 ${ui.text}`}>
        {hasFilters
          ? "Try another title search or clear the active filters."
          : "Check back after authors publish their first MiniBlog posts."}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={`p-6 ${ui.errorPanel}`}>
      <p className="text-sm font-semibold uppercase tracking-wide">
        Unable to load blogs
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-normal">
        Something went wrong.
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7">{message}</p>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return "The blog list could not be loaded. Try again later.";
}

function getActiveTag(
  searchParams: { tag?: string | string[] } | undefined,
): string | null {
  const rawTag = Array.isArray(searchParams?.tag)
    ? searchParams?.tag[0]
    : searchParams?.tag;
  const tag = rawTag?.trim();

  return tag ? tag : null;
}

function getActiveTitle(
  searchParams: { title?: string | string[] } | undefined,
): string | null {
  const rawTitle = Array.isArray(searchParams?.title)
    ? searchParams?.title[0]
    : searchParams?.title;
  const title = rawTitle?.trim();

  return title ? title : null;
}

function getListHeading(
  activeTag: string | null,
  activeTitle: string | null,
): string {
  if (activeTag && activeTitle) {
    return `Search results for "${activeTitle}" tagged #${activeTag}.`;
  }

  if (activeTitle) {
    return `Search results for "${activeTitle}".`;
  }

  if (activeTag) {
    return `Read posts tagged #${activeTag}.`;
  }

  return "Read the latest from MiniBlog.";
}

function getListDescription(
  activeTag: string | null,
  activeTitle: string | null,
): string {
  if (activeTag && activeTitle) {
    return "Browse published stories matching this title search and tag.";
  }

  if (activeTitle) {
    return "Browse published stories with titles matching your search.";
  }

  if (activeTag) {
    return "Browse published stories that share this MiniBlog tag.";
  }

  return "Browse public stories shared by MiniBlog authors.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
