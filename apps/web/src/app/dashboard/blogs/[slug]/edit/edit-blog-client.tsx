"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ApiRequestError as AuthApiRequestError, getMe } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";
import {
  ApiRequestError,
  deleteBlog,
  getMyBlog,
  updateBlog,
} from "@/lib/api/blogs";
import type { Blog, BlogStatus, UpdateBlogPayload } from "@/lib/api/blogs";
import { routes } from "@/lib/routes";

type FormError = {
  fields?: Record<string, string>;
  message: string;
};

type BlogLoadState =
  | {
      blog: null;
      message?: never;
      status: "loading";
    }
  | {
      blog: Blog;
      message?: never;
      status: "ready";
    }
  | {
      blog: null;
      message: string;
      status: "error";
    }
  | {
      blog: null;
      message: string;
      status: "not-found";
    };

type CurrentUserState =
  | {
      status: "idle";
      user: null;
      message?: never;
    }
  | {
      status: "loading";
      user: null;
      message?: never;
    }
  | {
      status: "ready";
      user: AuthUser;
      message?: never;
    }
  | {
      status: "unauthenticated";
      user: null;
      message: string;
    }
  | {
      status: "error";
      user: null;
      message: string;
    };

const ACCESS_TOKEN_STORAGE_KEY = "miniblog.dev.accessToken";

export function EditBlogClient({ slug }: { slug: string }) {
  const router = useRouter();
  const accessToken = useAccessToken();
  const [removedToken, setRemovedToken] = useState(false);
  const [blogState, setBlogState] = useState<BlogLoadState>({
    blog: null,
    status: "loading",
  });
  const [currentUserState, setCurrentUserState] = useState<CurrentUserState>({
    status: "idle",
    user: null,
  });
  const [formError, setFormError] = useState<FormError | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const activeAccessToken = removedToken ? null : accessToken;

  useEffect(() => {
    let isMounted = true;

    async function loadBlog() {
      if (!activeAccessToken) {
        setBlogState({ blog: null, status: "loading" });
        return;
      }

      try {
        const { blog } = await getMyBlog(slug, activeAccessToken);

        if (isMounted) {
          setBlogState({ blog, status: "ready" });
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (isNotFoundError(error)) {
          setBlogState({
            blog: null,
            message: "Blog was not found.",
            status: "not-found",
          });
          return;
        }

        setBlogState({
          blog: null,
          message: getErrorMessage(error),
          status: "error",
        });
      }
    }

    void loadBlog();

    return () => {
      isMounted = false;
    };
  }, [activeAccessToken, slug]);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      if (!activeAccessToken) {
        setCurrentUserState({
          message: "Log in to edit this blog post.",
          status: "unauthenticated",
          user: null,
        });
        return;
      }

      setCurrentUserState({ status: "loading", user: null });

      try {
        const { user } = await getMe(activeAccessToken);

        if (isMounted) {
          setCurrentUserState({ status: "ready", user });
        }
      } catch (error) {
        if (error instanceof AuthApiRequestError && error.status === 401) {
          window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
          setRemovedToken(true);
        }

        if (isMounted) {
          setCurrentUserState({
            message: getAuthErrorMessage(error),
            status:
              error instanceof AuthApiRequestError && error.status === 401
                ? "unauthenticated"
                : "error",
            user: null,
          });
        }
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [activeAccessToken]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!activeAccessToken) {
      setFormError({ message: "Log in to edit this blog post." });
      return;
    }

    if (
      blogState.status !== "ready" ||
      currentUserState.status !== "ready" ||
      !isCurrentUserAuthor(blogState.blog, currentUserState.user)
    ) {
      setFormError({ message: "Only the blog author can edit this post." });
      return;
    }

    setIsSaving(true);

    const formData = new FormData(event.currentTarget);

    try {
      const { blog } = await updateBlog(
        slug,
        getPayload(formData),
        activeAccessToken,
      );
      router.push(
        blog.status === "published"
          ? routes.blog(blog.slug)
          : routes.editBlog(blog.slug),
      );
    } catch (error) {
      handleAuthenticatedError(error);
      setFormError(toFormError(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setFormError(null);

    if (!activeAccessToken) {
      setFormError({ message: "Log in to delete this blog post." });
      return;
    }

    if (
      blogState.status !== "ready" ||
      currentUserState.status !== "ready" ||
      !isCurrentUserAuthor(blogState.blog, currentUserState.user)
    ) {
      setFormError({ message: "Only the blog author can delete this post." });
      return;
    }

    const confirmed = window.confirm(
      "Delete this blog post? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteBlog(slug, activeAccessToken);
      router.push(routes.blogs);
    } catch (error) {
      handleAuthenticatedError(error);
      setFormError(toFormError(error));
    } finally {
      setIsDeleting(false);
    }
  }

  function handleAuthenticatedError(error: unknown) {
    if (error instanceof ApiRequestError && error.status === 401) {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      setRemovedToken(true);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#f5f3ff_100%)] px-6 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link
            href={routes.blogs}
            className="text-xl font-bold tracking-tight text-purpleInk"
          >
            MiniBlog
          </Link>
          <nav
            aria-label="Edit blog navigation"
            className="flex items-center gap-3"
          >
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
              href={routes.dashboard}
            >
              Dashboard
            </Link>
          </nav>
        </header>

        <section className="py-12 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
              Edit post
            </p>
            <h1 className="mt-4 text-balance text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
              Update a MiniBlog post.
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-700 sm:text-lg">
              Save changes or delete the post with the authenticated MiniBlog
              API.
            </p>
          </div>

          <EditBlogContent
            accessToken={activeAccessToken}
            blogState={blogState}
            currentUserState={currentUserState}
            error={formError}
            isDeleting={isDeleting}
            isSaving={isSaving}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
          />
        </section>
      </div>
    </main>
  );
}

function EditBlogContent({
  accessToken,
  blogState,
  currentUserState,
  error,
  isDeleting,
  isSaving,
  onDelete,
  onSubmit,
}: {
  accessToken: string | null;
  blogState: BlogLoadState;
  currentUserState: CurrentUserState;
  error: FormError | null;
  isDeleting: boolean;
  isSaving: boolean;
  onDelete: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!accessToken) {
    return (
      <UnauthenticatedState
        error={
          error ?? {
            message:
              currentUserState.message ?? "Log in to edit this blog post.",
          }
        }
      />
    );
  }

  if (blogState.status === "loading" || currentUserState.status === "loading") {
    return <LoadingState />;
  }

  if (blogState.status === "not-found") {
    return <NotFoundState message={blogState.message} />;
  }

  if (blogState.status === "error") {
    return <ErrorState message={blogState.message} />;
  }

  if (currentUserState.status === "error") {
    return <ErrorState message={currentUserState.message} />;
  }

  if (
    currentUserState.status !== "ready" ||
    !isCurrentUserAuthor(blogState.blog, currentUserState.user)
  ) {
    return <ForbiddenState />;
  }

  return (
    <EditBlogForm
      blog={blogState.blog}
      error={error}
      isDeleting={isDeleting}
      isSaving={isSaving}
      onDelete={onDelete}
      onSubmit={onSubmit}
    />
  );
}

function EditBlogForm({
  blog,
  error,
  isDeleting,
  isSaving,
  onDelete,
  onSubmit,
}: {
  blog: Blog;
  error: FormError | null;
  isDeleting: boolean;
  isSaving: boolean;
  onDelete: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isBusy = isDeleting || isSaving;

  return (
    <form
      className="rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10 sm:p-8"
      onSubmit={onSubmit}
    >
      <div className="grid gap-5">
        <TextField
          defaultValue={blog.title}
          error={error?.fields?.title}
          label="Title"
          name="title"
          placeholder="My first MiniBlog post"
          required
        />
        <TextAreaField
          defaultValue={blog.excerpt ?? ""}
          error={error?.fields?.excerpt}
          label="Excerpt"
          name="excerpt"
          placeholder="A short summary for readers."
          rows={3}
        />
        <TextAreaField
          defaultValue={blog.content}
          error={error?.fields?.content}
          label="Content"
          name="content"
          placeholder="Write your post content..."
          required
          rows={10}
        />
        <StatusField defaultValue={blog.status} error={error?.fields?.status} />
        {error ? <FormErrorMessage error={error} /> : null}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-red-200 bg-white px-6 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isBusy}
            onClick={onDelete}
            type="button"
          >
            {isDeleting ? "Deleting..." : "Delete post"}
          </button>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-purple-200 bg-white px-6 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
              href={
                blog.status === "published"
                  ? routes.blog(blog.slug)
                  : routes.dashboard
              }
            >
              Cancel
            </Link>
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isBusy}
              type="submit"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10 sm:p-8">
      <div className="h-4 w-36 rounded-full bg-purple-100" />
      <div className="mt-5 h-12 rounded-lg bg-slate-100" />
      <div className="mt-5 h-24 rounded-lg bg-slate-100" />
      <div className="mt-5 h-40 rounded-lg bg-slate-100" />
      <div className="mt-5 h-12 rounded-lg bg-purple-100" />
    </div>
  );
}

function UnauthenticatedState({ error }: { error: FormError }) {
  return (
    <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10 sm:p-8">
      <FormErrorMessage error={error} />
      <Link
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
        href={routes.login}
      >
        Go to login
      </Link>
    </div>
  );
}

function NotFoundState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-purple-100 bg-white p-8 text-center shadow-2xl shadow-purple-950/10">
      <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
        Blog not found
      </p>
      <h2 className="mt-3 text-2xl font-bold tracking-normal text-slate-950">
        This post is not available.
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-slate-700">
        {message}
      </p>
      <Link
        className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
        href={routes.blogs}
      >
        Back to blogs
      </Link>
    </div>
  );
}

function ForbiddenState() {
  return (
    <div className="rounded-xl border border-purple-100 bg-white p-8 text-center shadow-2xl shadow-purple-950/10">
      <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
        Author access required
      </p>
      <h2 className="mt-3 text-2xl font-bold tracking-normal text-slate-950">
        You cannot edit this post.
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-slate-700">
        Only the author of this MiniBlog post can edit or delete it.
      </p>
      <Link
        className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
        href={routes.blogs}
      >
        Back to blogs
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-2xl shadow-red-950/5">
      <p className="text-sm font-semibold uppercase tracking-wide">
        Unable to load blog
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-normal">
        Something went wrong.
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7">{message}</p>
    </div>
  );
}

function TextField({
  defaultValue,
  error,
  label,
  name,
  placeholder,
  required = false,
}: {
  defaultValue: string;
  error?: string;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        className="mt-2 min-h-12 w-full rounded-lg border border-purple-100 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        type="text"
      />
      {error ? (
        <span className="mt-2 block text-sm text-red-700">{error}</span>
      ) : null}
    </label>
  );
}

function TextAreaField({
  defaultValue,
  error,
  label,
  name,
  placeholder,
  required = false,
  rows,
}: {
  defaultValue: string;
  error?: string;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  rows: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <textarea
        className="mt-2 w-full resize-y rounded-lg border border-purple-100 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
      {error ? (
        <span className="mt-2 block text-sm text-red-700">{error}</span>
      ) : null}
    </label>
  );
}

function StatusField({
  defaultValue,
  error,
}: {
  defaultValue: BlogStatus;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">Status</span>
      <select
        className="mt-2 min-h-12 w-full rounded-lg border border-purple-100 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
        defaultValue={defaultValue}
        name="status"
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
      {error ? (
        <span className="mt-2 block text-sm text-red-700">{error}</span>
      ) : null}
    </label>
  );
}

function FormErrorMessage({ error }: { error: FormError }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {error.message}
    </p>
  );
}

function useAccessToken(): string | null {
  return useSyncExternalStore(
    subscribeToAccessToken,
    getAccessTokenSnapshot,
    () => null,
  );
}

function subscribeToAccessToken(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

function getAccessTokenSnapshot(): string | null {
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function getPayload(formData: FormData): UpdateBlogPayload {
  return {
    content: getFormValue(formData, "content"),
    excerpt: getFormValue(formData, "excerpt").trim() || null,
    status: getStatus(formData),
    title: getFormValue(formData, "title"),
  };
}

function getStatus(formData: FormData): BlogStatus {
  const status = getFormValue(formData, "status");

  return status === "published" ? "published" : "draft";
}

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
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

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthApiRequestError) {
    return error.message;
  }

  return "The current user could not be loaded. Try again later.";
}

function toFormError(error: unknown): FormError {
  if (error instanceof ApiRequestError) {
    return {
      fields: error.fields,
      message: error.message,
    };
  }

  return {
    message: "Something went wrong. Try again.",
  };
}

function isCurrentUserAuthor(blog: Blog, user: AuthUser): boolean {
  return user.id === (blog.author?.id ?? blog.authorId);
}
