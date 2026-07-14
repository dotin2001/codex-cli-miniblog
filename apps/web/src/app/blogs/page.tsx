import Link from "next/link";

import { ApiRequestError, getBlogs } from "@/lib/api/blogs";
import type { Blog, Pagination } from "@/lib/api/blogs";

export const dynamic = "force-dynamic";

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
    <main className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#f5f3ff_100%)] px-6 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-purpleInk">
            MiniBlog
          </Link>
          <nav aria-label="Blog navigation" className="flex items-center gap-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
              href="/login"
            >
              Login
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}

function BlogList({ blogs, pagination }: { blogs: Blog[]; pagination: Pagination }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
            Published posts
          </p>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
            Read the latest from MiniBlog.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-700 sm:text-lg">
            Browse public stories shared by MiniBlog authors.
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-600">
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
    <article className="flex h-full flex-col rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-slate-600">
        <span>{blog.author?.name ?? "Unknown author"}</span>
        <span aria-hidden="true" className="text-purple-300">
          /
        </span>
        <time dateTime={blog.createdAt}>{formatDate(blog.createdAt)}</time>
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-normal text-slate-950">
        <Link className="transition hover:text-purpleInk" href={`/blogs/${blog.slug}`}>
          {blog.title}
        </Link>
      </h2>
      <p className="mt-4 line-clamp-3 flex-1 text-base leading-7 text-slate-700">
        {blog.excerpt ?? "No excerpt available."}
      </p>
      <Link
        className="mt-6 inline-flex min-h-10 w-fit items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
        href={`/blogs/${blog.slug}`}
      >
        Read post
      </Link>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-xl border border-purple-100 bg-white p-8 text-center shadow-2xl shadow-purple-950/10">
      <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
        No posts yet
      </p>
      <h2 className="mt-3 text-2xl font-bold tracking-normal text-slate-950">
        Published blogs will appear here.
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-slate-700">
        Check back after authors publish their first MiniBlog posts.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-2xl shadow-red-950/5">
      <p className="text-sm font-semibold uppercase tracking-wide">Unable to load blogs</p>
      <h1 className="mt-3 text-3xl font-bold tracking-normal">Something went wrong.</h1>
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
    year: "numeric"
  }).format(new Date(value));
}
