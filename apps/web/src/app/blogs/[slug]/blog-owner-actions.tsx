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
import { ui } from "@/lib/ui-styles";

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
    <div className={`mt-8 p-4 sm:p-5 ${ui.surface}`}>
      <div className="sm:flex sm:items-center sm:justify-between sm:gap-4">
        <p className={`text-sm font-semibold ${ui.text}`}>Manage this post</p>
        <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:flex-row sm:items-center">
          <Link
            className={`${ui.primaryButton} min-h-10 px-4`}
            href={routes.editBlog(blog.slug)}
          >
            Edit Blog
          </Link>
          <button
            className={`${ui.destructiveButton} min-h-10 px-4`}
            disabled={isDeleting}
            onClick={handleDelete}
            type="button"
          >
            {isDeleting ? "Deleting..." : "Delete Blog"}
          </button>
        </div>
      </div>
      {error ? (
        <p className={`mt-4 px-4 py-3 text-sm ${ui.errorBox}`}>
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
