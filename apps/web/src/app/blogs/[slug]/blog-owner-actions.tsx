"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiRequestError, getMe } from "@/lib/api/auth";
import { deleteBlog } from "@/lib/api/blogs";
import type { Blog } from "@/lib/api/blogs";
import {
  clearStoredAccessToken,
  isUnauthorizedApiError,
  runWithFreshAccessToken,
  useAccessToken,
} from "@/lib/auth-session";
import { routes } from "@/lib/routes";

type OwnerActionState = "idle" | "checking" | "owner" | "not-owner";

export function BlogOwnerActions({ blog }: { blog: Blog }) {
  const router = useRouter();
  const accessToken = useAccessToken();
  const [removedToken, setRemovedToken] = useState(false);
  const [state, setState] = useState<OwnerActionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkOwnership() {
      if (removedToken) {
        setState("idle");
        return;
      }

      setState("checking");

      try {
        const { user } = await runWithFreshAccessToken((accessToken) =>
          getMe(accessToken)
        );
        const authorId = blog.author?.id ?? blog.authorId;

        if (isMounted) {
          setState(user.id === authorId ? "owner" : "not-owner");
        }
      } catch (caughtError) {
        if (isUnauthorizedApiError(caughtError)) {
          clearStoredAccessToken();
          setRemovedToken(true);
        }

        if (isMounted) {
          setState("not-owner");
        }
      }
    }

    void checkOwnership();

    return () => {
      isMounted = false;
    };
  }, [accessToken, removedToken, blog.author?.id, blog.authorId]);

  async function handleDelete() {
    setError(null);

    if (removedToken || state !== "owner") {
      setError("Only the blog author can delete this post.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this blog post? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await runWithFreshAccessToken((accessToken) =>
        deleteBlog(blog.slug, accessToken)
      );
      router.push(routes.blogs);
    } catch (caughtError) {
      if (isUnauthorizedApiError(caughtError)) {
        clearStoredAccessToken();
        setRemovedToken(true);
      }

      setError(getActionErrorMessage(caughtError));
    } finally {
      setIsDeleting(false);
    }
  }

  if (state !== "owner") {
    return null;
  }

  return (
    <div className="mt-8 rounded-xl border border-purple-100 bg-white p-4 shadow-2xl shadow-purple-950/10 sm:p-5">
      <div className="sm:flex sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm font-semibold text-slate-700">Manage this post</p>
        <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:flex-row sm:items-center">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
            href={routes.editBlog(blog.slug)}
          >
            Edit Blog
          </Link>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isDeleting}
            onClick={handleDelete}
            type="button"
          >
            {isDeleting ? "Deleting..." : "Delete Blog"}
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function getActionErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return "The blog post could not be deleted. Try again.";
}
