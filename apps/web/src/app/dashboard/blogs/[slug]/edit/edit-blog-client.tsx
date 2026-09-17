"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { ApiRequestError as AuthApiRequestError, getMe } from "@/lib/api/auth";
import type { AuthUser } from "@/lib/api/auth";
import {
  ApiRequestError,
  deleteBlog,
  getMyBlog,
  updateBlog,
} from "@/lib/api/blogs";
import type { Blog, BlogStatus, UpdateBlogPayload } from "@/lib/api/blogs";
import {
  clearStoredAccessToken,
  isUnauthorizedApiError,
  runWithFreshAccessToken,
  useAccessToken,
} from "@/lib/auth-session";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

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
  const canTrySession = !removedToken;

  useEffect(() => {
    let isMounted = true;

    async function loadBlog() {
      if (removedToken) {
        setBlogState({ blog: null, status: "loading" });
        return;
      }

      try {
        const { blog } = await runWithFreshAccessToken((accessToken) =>
          getMyBlog(slug, accessToken)
        );

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
  }, [accessToken, removedToken, slug]);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      if (removedToken) {
        setCurrentUserState({
          message: "Log in to edit this blog post.",
          status: "unauthenticated",
          user: null,
        });
        return;
      }

      setCurrentUserState({ status: "loading", user: null });

      try {
        const { user } = await runWithFreshAccessToken((accessToken) =>
          getMe(accessToken)
        );

        if (isMounted) {
          setCurrentUserState({ status: "ready", user });
        }
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          clearStoredAccessToken();
          setRemovedToken(true);
        }

        if (isMounted) {
          setCurrentUserState({
            message: getAuthErrorMessage(error),
            status:
              isUnauthorizedApiError(error)
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
  }, [accessToken, removedToken]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (removedToken) {
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
      const { blog } = await runWithFreshAccessToken(
        (accessToken) => updateBlog(slug, getPayload(formData), accessToken),
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

    if (removedToken) {
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
      await runWithFreshAccessToken((accessToken) =>
        deleteBlog(slug, accessToken)
      );
      router.push(routes.blogs);
    } catch (error) {
      handleAuthenticatedError(error);
      setFormError(toFormError(error));
    } finally {
      setIsDeleting(false);
    }
  }

  function handleAuthenticatedError(error: unknown) {
    if (isUnauthorizedApiError(error)) {
      clearStoredAccessToken();
      setRemovedToken(true);
    }
  }

  return (
    <main className={ui.pageGradient}>
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link
            href={routes.blogs}
            className={ui.brand}
          >
            MiniBlog
          </Link>
          <nav
            aria-label="Edit blog navigation"
            className="flex flex-wrap items-center justify-end gap-3"
          >
            <ThemeToggle />
            <Link
              className={`${ui.secondaryButton} min-h-10 px-4`}
              href={routes.dashboard}
            >
              Dashboard
            </Link>
          </nav>
        </header>

        <section className="py-12 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <p className={ui.eyebrow}>
              Edit post
            </p>
            <h1 className={`mt-4 text-balance text-4xl sm:text-5xl ${ui.title}`}>
              Update a MiniBlog post.
            </h1>
            <p className={`mt-5 text-base leading-8 sm:text-lg ${ui.text}`}>
              Save changes or delete the post with the authenticated MiniBlog
              API.
            </p>
          </div>

          <EditBlogContent
            blogState={blogState}
            canTrySession={canTrySession}
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
  blogState,
  canTrySession,
  currentUserState,
  error,
  isDeleting,
  isSaving,
  onDelete,
  onSubmit,
}: {
  blogState: BlogLoadState;
  canTrySession: boolean;
  currentUserState: CurrentUserState;
  error: FormError | null;
  isDeleting: boolean;
  isSaving: boolean;
  onDelete: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!canTrySession) {
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
      className={`p-6 sm:p-8 ${ui.surface}`}
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
        <TextField
          defaultValue={blog.tags.map((tag) => tag.name).join(", ")}
          error={error?.fields?.tags}
          label="Tags"
          name="tags"
          placeholder="Python, Flask, Notes"
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
        <div className={`flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between ${ui.divider}`}>
          <button
            className={`${ui.destructiveButton} min-h-12 px-6`}
            disabled={isBusy}
            onClick={onDelete}
            type="button"
          >
            {isDeleting ? "Deleting..." : "Delete post"}
          </button>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Link
              className={`${ui.secondaryButton} min-h-12 px-6`}
              href={
                blog.status === "published"
                  ? routes.blog(blog.slug)
                  : routes.dashboard
              }
            >
              Cancel
            </Link>
            <button
              className={`${ui.primaryButton} min-h-12 px-6`}
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
    <div className={`p-6 sm:p-8 ${ui.surface}`}>
      <div className={`h-4 w-36 rounded-full ${ui.skeletonPurple}`} />
      <div className={`mt-5 h-12 rounded-lg ${ui.skeletonNeutral}`} />
      <div className={`mt-5 h-24 rounded-lg ${ui.skeletonNeutral}`} />
      <div className={`mt-5 h-40 rounded-lg ${ui.skeletonNeutral}`} />
      <div className={`mt-5 h-12 rounded-lg ${ui.skeletonPurple}`} />
    </div>
  );
}

function UnauthenticatedState({ error }: { error: FormError }) {
  return (
    <div className={`p-6 sm:p-8 ${ui.surface}`}>
      <FormErrorMessage error={error} />
      <Link
        className={`mt-6 min-h-12 w-full px-6 ${ui.primaryButton}`}
        href={routes.login}
      >
        Go to login
      </Link>
    </div>
  );
}

function NotFoundState({ message }: { message: string }) {
  return (
    <div className={`p-8 text-center ${ui.surface}`}>
      <p className={ui.eyebrow}>
        Blog not found
      </p>
      <h2 className={`mt-3 text-2xl ${ui.title}`}>
        This post is not available.
      </h2>
      <p className={`mx-auto mt-3 max-w-lg text-base leading-7 ${ui.text}`}>
        {message}
      </p>
      <Link
        className={`mt-6 min-h-10 px-4 ${ui.primaryButton}`}
        href={routes.blogs}
      >
        Back to blogs
      </Link>
    </div>
  );
}

function ForbiddenState() {
  return (
    <div className={`p-8 text-center ${ui.surface}`}>
      <p className={ui.eyebrow}>
        Author access required
      </p>
      <h2 className={`mt-3 text-2xl ${ui.title}`}>
        You cannot edit this post.
      </h2>
      <p className={`mx-auto mt-3 max-w-lg text-base leading-7 ${ui.text}`}>
        Only the author of this MiniBlog post can edit or delete it.
      </p>
      <Link
        className={`mt-6 min-h-10 px-4 ${ui.primaryButton}`}
        href={routes.blogs}
      >
        Back to blogs
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={`p-6 ${ui.errorPanel}`}>
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
      <span className={ui.label}>{label}</span>
      <input
        className={`mt-2 min-h-12 w-full px-4 ${ui.input}`}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        type="text"
      />
      {error ? (
        <span className={ui.fieldError}>{error}</span>
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
      <span className={ui.label}>{label}</span>
      <textarea
        className={`mt-2 w-full resize-y px-4 py-3 leading-6 ${ui.input}`}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
      {error ? (
        <span className={ui.fieldError}>{error}</span>
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
      <span className={ui.label}>Status</span>
      <select
        className={`mt-2 min-h-12 w-full px-4 ${ui.input}`}
        defaultValue={defaultValue}
        name="status"
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
      {error ? (
        <span className={ui.fieldError}>{error}</span>
      ) : null}
    </label>
  );
}

function FormErrorMessage({ error }: { error: FormError }) {
  return (
    <p className={`px-4 py-3 text-sm ${ui.errorBox}`}>
      {error.message}
    </p>
  );
}

function getPayload(formData: FormData): UpdateBlogPayload {
  return {
    content: getFormValue(formData, "content"),
    excerpt: getFormValue(formData, "excerpt").trim() || null,
    status: getStatus(formData),
    tags: getTags(formData),
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

function getTags(formData: FormData): string[] {
  return getFormValue(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
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
