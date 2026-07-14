import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiRequestError, getBlog } from "@/lib/api/blogs";
import type { Blog } from "@/lib/api/blogs";

export const dynamic = "force-dynamic";

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type BlogDetailState =
  | {
      blog: Blog;
      status: "success";
    }
  | {
      status: "not-found";
    }
  | {
      message: string;
      status: "error";
    };

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const state = await loadBlog(slug);

  if (state.status === "not-found") {
    notFound();
  }

  return (
    <BlogDetailShell>
      {state.status === "success" ? (
        <BlogArticle blog={state.blog} />
      ) : (
        <section className="py-12 sm:py-16">
          <ErrorState message={state.message} />
        </section>
      )}
    </BlogDetailShell>
  );
}

async function loadBlog(slug: string): Promise<BlogDetailState> {
  try {
    const { blog } = await getBlog(slug);

    return { blog, status: "success" };
  } catch (error) {
    if (isNotFoundError(error)) {
      return { status: "not-found" };
    }

    return { message: getErrorMessage(error), status: "error" };
  }
}

function BlogDetailShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#f5f3ff_100%)] px-6 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-purpleInk">
            MiniBlog
          </Link>
          <nav aria-label="Blog detail navigation" className="flex items-center gap-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
              href="/blogs"
            >
              All blogs
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}

function BlogArticle({ blog }: { blog: Blog }) {
  return (
    <article className="py-12 sm:py-16">
      <Link
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
        href="/blogs"
      >
        Back to blogs
      </Link>
      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
          Published post
        </p>
        <h1 className="mt-4 text-balance text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
          {blog.title}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-slate-600">
          <span>{blog.author?.name ?? "Unknown author"}</span>
          <span aria-hidden="true" className="text-purple-300">
            /
          </span>
          <span>{blog.author ? `Author #${blog.author.id}` : `Author #${blog.authorId}`}</span>
          <span aria-hidden="true" className="text-purple-300">
            /
          </span>
          <time dateTime={blog.createdAt}>{formatDate(blog.createdAt)}</time>
        </div>
        {blog.excerpt ? (
          <p className="mt-8 rounded-xl border border-purple-100 bg-white p-5 text-lg leading-8 text-slate-700 shadow-2xl shadow-purple-950/10">
            {blog.excerpt}
          </p>
        ) : null}
      </div>
      <div className="mt-8 rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10 sm:p-8">
        <div className="whitespace-pre-wrap text-base leading-8 text-slate-800">
          {blog.content}
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
          href={`/dashboard/blogs/${blog.slug}/edit`}
        >
          Edit post
        </Link>
      </div>
    </article>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-2xl shadow-red-950/5">
      <p className="text-sm font-semibold uppercase tracking-wide">Unable to load blog</p>
      <h1 className="mt-3 text-3xl font-bold tracking-normal">Something went wrong.</h1>
      <p className="mt-3 max-w-2xl text-base leading-7">{message}</p>
    </div>
  );
}

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.status === 404 || error.code === "BLOG_NOT_FOUND")
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return "The blog post could not be loaded. Try again later.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
