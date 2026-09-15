"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BlogTagList } from "@/components/blog-tag-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApiRequestError, deleteBlog, getMyBlogs } from "@/lib/api/blogs";
import type { Blog, Pagination } from "@/lib/api/blogs";
import {
  clearStoredAccessToken,
  isUnauthorizedApiError,
  runWithFreshAccessToken,
  useAccessToken,
} from "@/lib/auth-session";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

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
    <main className={ui.pageGradient}>
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={routes.blogs}
            className={ui.brand}
          >
            MiniBlog
          </Link>
          <nav
            aria-label="My blogs navigation"
            className="flex flex-wrap items-center gap-3"
          >
            <ThemeToggle />
            <Link
              className={`${ui.secondaryButton} min-h-10 px-4`}
              href={routes.dashboard}
            >
              Dashboard
            </Link>
            <Link
              className={`${ui.primaryButton} min-h-10 px-4`}
              href={routes.createBlog}
            >
              Create New Blog
            </Link>
          </nav>
        </header>

        <section className="py-12 sm:py-16">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className={ui.eyebrow}>
                My blogs
              </p>
              <h1 className={`mt-4 text-balance text-4xl sm:text-5xl ${ui.title}`}>
                Manage your MiniBlog posts.
              </h1>
              <p className={`mt-5 max-w-xl text-base leading-8 sm:text-lg ${ui.text}`}>
                Drafts and published posts from your account appear here.
              </p>
            </div>
            {state.status === "ready" ? (
              <p className={`text-sm font-semibold ${ui.muted}`}>
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
        <p className={`px-4 py-3 text-sm ${ui.errorBox}`}>
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
    <article className={`p-6 ${ui.surface}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={blog.status} />
            <time
              className={`text-sm font-semibold ${ui.muted}`}
              dateTime={blog.createdAt}
            >
              {formatDate(blog.createdAt)}
            </time>
          </div>
          <h2 className={`mt-4 text-2xl ${ui.title}`}>
            {blog.title}
          </h2>
          <p className={`mt-4 line-clamp-3 text-base leading-7 ${ui.text}`}>
            {blog.excerpt ?? "No excerpt available."}
          </p>
          <BlogTagList className="mt-4" tags={blog.tags} />
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          {isPublished ? (
            <Link
              className={`${ui.primaryButton} min-h-10 px-4`}
              href={routes.blog(blog.slug)}
            >
              View
            </Link>
          ) : null}
          <Link
            className={
              isPublished
                ? `${ui.secondaryButton} min-h-10 px-4`
                : `${ui.primaryButton} min-h-10 px-4`
            }
            href={routes.editBlog(blog.slug)}
          >
            Edit
          </Link>
          <button
            className={`${ui.destructiveButton} min-h-10 px-4`}
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
        isPublished ? ui.successBadge : ui.warningBadge
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
          className={`p-6 ${ui.surface}`}
          key={item}
        >
          <div className={`h-7 w-24 rounded-full ${ui.skeletonPurple}`} />
          <div className={`mt-5 h-7 w-2/3 rounded-lg ${ui.skeletonNeutral}`} />
          <div className={`mt-4 h-4 w-full rounded-lg ${ui.skeletonNeutral}`} />
          <div className={`mt-3 h-4 w-4/5 rounded-lg ${ui.skeletonNeutral}`} />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={`p-8 text-center ${ui.surface}`}>
      <p className={ui.eyebrow}>
        No blogs yet
      </p>
      <h2 className={`mt-3 text-2xl ${ui.title}`}>
        Start with your first post.
      </h2>
      <p className={`mx-auto mt-3 max-w-lg text-base leading-7 ${ui.text}`}>
        Drafts and published posts will appear here after you create them.
      </p>
      <Link
        className={`mt-6 min-h-12 px-6 ${ui.primaryButton}`}
        href={routes.createBlog}
      >
        Create New Blog
      </Link>
    </div>
  );
}

function UnauthenticatedState({ message }: { message: string }) {
  return (
    <div className={`p-6 sm:p-8 ${ui.surface}`}>
      <p className={`px-4 py-3 text-sm ${ui.errorBox}`}>
        {message}
      </p>
      <Link
        className={`mt-6 min-h-12 w-full px-6 ${ui.primaryButton}`}
        href={routes.login}
      >
        Go to login
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={`p-6 ${ui.errorPanel}`}>
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
