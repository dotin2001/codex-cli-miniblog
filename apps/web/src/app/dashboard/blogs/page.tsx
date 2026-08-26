"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ApiRequestError, deleteBlog, getMyBlogs } from "@/lib/api/blogs";
import type { Blog, Pagination } from "@/lib/api/blogs";
import {
  clearStoredAccessToken,
  isUnauthorizedApiError,
  runWithFreshAccessToken,
  useAccessToken,
} from "@/lib/auth-session";
import { routes } from "@/lib/routes";

type MyBlogsState =
  | {
      blogs: Blog[];
      message?: never;
      pagination: Pagination;
      status: "ready";
    }
  | {
      blogs: [];
      message?: never;
      pagination: null;
      status: "loading";
    }
  | {
      blogs: [];
      message: string;
      pagination: null;
      status: "error";
    };

const PAGE_SIZE = 10;

export default function MyBlogsPage() {
  const accessToken = useAccessToken();
  const [removedToken, setRemovedToken] = useState(false);
  const [state, setState] = useState<MyBlogsState>({
    blogs: [],
    pagination: null,
    status: "loading",
  });
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const activeAccessToken = removedToken ? null : accessToken;
  const canTrySession = !removedToken;

  useEffect(() => {
    let isMounted = true;

    if (removedToken) {
      return;
    }

    async function loadBlogs() {
      try {
        const { blogs, pagination } = await runWithFreshAccessToken(
          (accessToken) =>
            getMyBlogs({ page: 1, perPage: PAGE_SIZE }, accessToken),
        );

        if (isMounted) {
          setState({ blogs, pagination, status: "ready" });
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (isUnauthorizedApiError(error)) {
          clearStoredAccessToken();
          setRemovedToken(true);
          return;
        }

        setState({
          blogs: [],
          message: getErrorMessage(error),
          pagination: null,
          status: "error",
        });
      }
    }

    void loadBlogs();

    return () => {
      isMounted = false;
    };
  }, [removedToken]);

  async function handleDelete(blog: Blog) {
    setDeleteError(null);

    if (!activeAccessToken) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this blog post? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingSlug(blog.slug);

    try {
      await runWithFreshAccessToken((accessToken) =>
        deleteBlog(blog.slug, accessToken)
      );
      setState((currentState) => removeDeletedBlog(currentState, blog.id));
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        clearStoredAccessToken();
        setRemovedToken(true);
        return;
      }

      setDeleteError(getDeleteErrorMessage(error));
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#f5f3ff_100%)] px-6 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={routes.blogs}
            className="text-xl font-bold tracking-tight text-purpleInk"
          >
            MiniBlog
          </Link>
          <nav
            aria-label="My blogs navigation"
            className="flex flex-wrap items-center gap-3"
          >
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
              href={routes.dashboard}
            >
              Dashboard
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
              href={routes.createBlog}
            >
              Create New Blog
            </Link>
          </nav>
        </header>

        <section className="py-12 sm:py-16">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
                My blogs
              </p>
              <h1 className="mt-4 text-balance text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
                Manage your MiniBlog posts.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-700 sm:text-lg">
                Drafts and published posts from your account appear here.
              </p>
            </div>
            {state.status === "ready" ? (
              <p className="text-sm font-semibold text-slate-600">
                {state.pagination.total}{" "}
                {state.pagination.total === 1 ? "post" : "posts"}
              </p>
            ) : null}
          </div>

          <div className="mt-10">
            {canTrySession && state.status === "loading" ? (
              <LoadingState />
            ) : null}
            {!canTrySession ? (
              <UnauthenticatedState message="Log in to view your blogs." />
            ) : null}
            {canTrySession && state.status === "error" ? (
              <ErrorState message={state.message} />
            ) : null}
            {canTrySession && state.status === "ready" && state.blogs.length === 0 ? (
              <EmptyState />
            ) : null}
            {canTrySession && state.status === "ready" && state.blogs.length > 0 ? (
              <BlogList
                blogs={state.blogs}
                deleteError={deleteError}
                deletingSlug={deletingSlug}
                onDelete={handleDelete}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function BlogList({
  blogs,
  deleteError,
  deletingSlug,
  onDelete,
}: {
  blogs: Blog[];
  deleteError: string | null;
  deletingSlug: string | null;
  onDelete: (blog: Blog) => void;
}) {
  return (
    <div className="space-y-5">
      {deleteError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {deleteError}
        </p>
      ) : null}
      <div className="grid gap-5">
        {blogs.map((blog) => (
          <BlogCard
            blog={blog}
            isDeleting={deletingSlug === blog.slug}
            key={blog.id}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function BlogCard({
  blog,
  isDeleting,
  onDelete,
}: {
  blog: Blog;
  isDeleting: boolean;
  onDelete: (blog: Blog) => void;
}) {
  const isPublished = blog.status === "published";

  return (
    <article className="rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={blog.status} />
            <time
              className="text-sm font-semibold text-slate-600"
              dateTime={blog.createdAt}
            >
              {formatDate(blog.createdAt)}
            </time>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-normal text-slate-950">
            {blog.title}
          </h2>
          <p className="mt-4 line-clamp-3 text-base leading-7 text-slate-700">
            {blog.excerpt ?? "No excerpt available."}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          {isPublished ? (
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
              href={routes.blog(blog.slug)}
            >
              View
            </Link>
          ) : null}
          <Link
            className={
              isPublished
                ? "inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
                : "inline-flex min-h-10 items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
            }
            href={routes.editBlog(blog.slug)}
          >
            Edit
          </Link>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isDeleting}
            onClick={() => onDelete(blog)}
            type="button"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: Blog["status"] }) {
  const isPublished = status === "published";

  return (
    <span
      className={
        isPublished
          ? "inline-flex min-h-7 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold uppercase tracking-wide text-emerald-800"
          : "inline-flex min-h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-bold uppercase tracking-wide text-amber-800"
      }
    >
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-5">
      {[0, 1, 2].map((item) => (
        <div
          className="rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10"
          key={item}
        >
          <div className="h-7 w-24 rounded-full bg-purple-100" />
          <div className="mt-5 h-7 w-2/3 rounded-lg bg-slate-100" />
          <div className="mt-4 h-4 w-full rounded-lg bg-slate-100" />
          <div className="mt-3 h-4 w-4/5 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-purple-100 bg-white p-8 text-center shadow-2xl shadow-purple-950/10">
      <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
        No blogs yet
      </p>
      <h2 className="mt-3 text-2xl font-bold tracking-normal text-slate-950">
        Start with your first post.
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-slate-700">
        Drafts and published posts will appear here after you create them.
      </p>
      <Link
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
        href={routes.createBlog}
      >
        Create New Blog
      </Link>
    </div>
  );
}

function UnauthenticatedState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10 sm:p-8">
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {message}
      </p>
      <Link
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
        href={routes.login}
      >
        Go to login
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-2xl shadow-red-950/5">
      <p className="text-sm font-semibold uppercase tracking-wide">
        Unable to load blogs
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-normal">
        Something went wrong.
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7">{message}</p>
    </div>
  );
}

function removeDeletedBlog(state: MyBlogsState, blogId: number): MyBlogsState {
  if (state.status !== "ready") {
    return state;
  }

  const blogs = state.blogs.filter((blog) => blog.id !== blogId);
  const total = Math.max(state.pagination.total - 1, 0);

  return {
    blogs,
    pagination: {
      ...state.pagination,
      total,
      totalPages: Math.ceil(total / state.pagination.perPage),
    },
    status: "ready",
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return "Your blogs could not be loaded. Try again later.";
}

function getDeleteErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return "The blog post could not be deleted. Try again.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
