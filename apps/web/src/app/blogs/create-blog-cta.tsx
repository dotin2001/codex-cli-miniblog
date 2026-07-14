"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const ACCESS_TOKEN_STORAGE_KEY = "miniblog.dev.accessToken";

export function CreateBlogCta() {
  const accessToken = useAccessToken();

  if (!accessToken) {
    return null;
  }

  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
      href="/dashboard/blogs/new"
    >
      Create Blog
    </Link>
  );
}

function useAccessToken(): string | null {
  return useSyncExternalStore(subscribeToAccessToken, getAccessTokenSnapshot, () => null);
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
