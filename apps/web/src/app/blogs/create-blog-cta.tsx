"use client";

import Link from "next/link";

import { useAccessToken } from "@/lib/auth-session";
import { routes } from "@/lib/routes";

export function CreateBlogCta() {
  const accessToken = useAccessToken();

  if (!accessToken) {
    return null;
  }

  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
      href={routes.createBlog}
    >
      Create Blog
    </Link>
  );
}
