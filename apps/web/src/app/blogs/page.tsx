import Link from "next/link";
import type { Metadata } from "next";

import { CreateBlogCta } from "./create-blog-cta";
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

export default async function BlogsPage() {
  const state = await loadBlogs();

  return (
    <BlogShell>
      {state.status === "success" ? (
        <BlogList blogs={state.blogs} pagination={state.pagination} />
      ) : (
        <section className="py-12 sm:py-16">
          <ErrorState message={state.message} />
        </section>
      )}
    </BlogShell>
  );
}

async function loadBlogs(): Promise<BlogListState> {
  try {
    const { blogs, pagination } = await getBlogs({ page: 1, perPage: 10 });

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
  blogs,
  pagination,
}: {
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
            Read the latest from MiniBlog.
          </h1>
          <p className={`mt-5 max-w-xl text-base leading-8 sm:text-lg ${ui.text}`}>
            Browse public stories shared by MiniBlog authors.
          </p>
        </div>
        <p className={`text-sm font-semibold ${ui.muted}`}>
          {pagination.total} {pagination.total === 1 ? "post" : "posts"}
        </p>
      </div>

      {blogs.length > 0 ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {blogs.map((blog) => (
            <BlogCard blog={blog} key={blog.id} />
          ))}
        </div>
      ) : (
        <EmptyState />
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
      <Link
        className={`mt-6 min-h-10 w-fit px-4 ${ui.primaryButton}`}
        href={routes.blog(blog.slug)}
      >
        Read post
      </Link>
    </article>
  );
}

function EmptyState() {
  return (
    <div className={`mt-10 p-8 text-center ${ui.surface}`}>
      <p className={ui.eyebrow}>
        No posts yet
      </p>
      <h2 className={`mt-3 text-2xl ${ui.title}`}>
        Published blogs will appear here.
      </h2>
      <p className={`mx-auto mt-3 max-w-lg text-base leading-7 ${ui.text}`}>
        Check back after authors publish their first MiniBlog posts.
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
