"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { ApiRequestError, createBlog } from "@/lib/api/blogs";
import type { BlogStatus, CreateBlogPayload } from "@/lib/api/blogs";
import {
  clearStoredAccessToken,
  isUnauthorizedApiError,
  runWithFreshAccessToken,
} from "@/lib/auth-session";
import { routes } from "@/lib/routes";

type FormError = {
  fields?: Record<string, string>;
  message: string;
};

export default function NewBlogPage() {
  const router = useRouter();
  const [removedToken, setRemovedToken] = useState(false);
  const [error, setError] = useState<FormError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (removedToken) {
      setError({ message: "Log in to create a blog post." });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const { blog } = await runWithFreshAccessToken((accessToken) =>
        createBlog(getPayload(formData), accessToken)
      );
      router.push(
        blog.status === "published"
          ? routes.blog(blog.slug)
          : routes.editBlog(blog.slug),
      );
    } catch (caughtError) {
      if (isUnauthorizedApiError(caughtError)) {
        clearStoredAccessToken();
        setRemovedToken(true);
      }

      setError(toFormError(caughtError));
    } finally {
      setIsSubmitting(false);
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
            aria-label="Create blog navigation"
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
              New post
            </p>
            <h1 className="mt-4 text-balance text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
              Create a MiniBlog post.
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-700 sm:text-lg">
              Draft or publish a post with the authenticated MiniBlog API.
            </p>
          </div>

          {removedToken ? (
            <UnauthenticatedState
              error={error ?? { message: "Log in to create a blog post." }}
            />
          ) : (
            <BlogForm
              error={error}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function BlogForm({
  error,
  isSubmitting,
  onSubmit
}: {
  error: FormError | null;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10 sm:p-8"
      onSubmit={onSubmit}
    >
      <div className="grid gap-5">
        <TextField
          autoComplete="off"
          error={error?.fields?.title}
          label="Title"
          name="title"
          placeholder="My first MiniBlog post"
          required
        />
        <TextAreaField
          error={error?.fields?.excerpt}
          label="Excerpt"
          name="excerpt"
          placeholder="A short summary for readers."
          rows={3}
        />
        <TextAreaField
          error={error?.fields?.content}
          label="Content"
          name="content"
          placeholder="Write your post content..."
          required
          rows={10}
        />
        <StatusField error={error?.fields?.status} />
        {error ? <FormErrorMessage error={error} /> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-purple-200 bg-white px-6 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
            href={routes.dashboard}
          >
            Cancel
          </Link>
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating post..." : "Create post"}
          </button>
        </div>
      </div>
    </form>
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

function TextField({
  autoComplete,
  error,
  label,
  name,
  placeholder,
  required = false
}: {
  autoComplete: string;
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
        autoComplete={autoComplete}
        className="mt-2 min-h-12 w-full rounded-lg border border-purple-100 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
        name={name}
        placeholder={placeholder}
        required={required}
        type="text"
      />
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function TextAreaField({
  error,
  label,
  name,
  placeholder,
  required = false,
  rows
}: {
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
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function StatusField({ error }: { error?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">Status</span>
      <select
        className="mt-2 min-h-12 w-full rounded-lg border border-purple-100 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
        defaultValue="draft"
        name="status"
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
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

function getPayload(formData: FormData): CreateBlogPayload {
  const excerpt = getFormValue(formData, "excerpt").trim();

  return {
    content: getFormValue(formData, "content"),
    ...(excerpt ? { excerpt } : {}),
    status: getStatus(formData),
    title: getFormValue(formData, "title")
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

function toFormError(error: unknown): FormError {
  if (error instanceof ApiRequestError) {
    return {
      fields: error.fields,
      message: error.message
    };
  }

  return {
    message: "Something went wrong. Try again."
  };
}
