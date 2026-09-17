"use client";

import Link from "next/link";

import { useAccessToken } from "@/lib/auth-session";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

export function CreateBlogCta() {
  const accessToken = useAccessToken();

  if (!accessToken) {
    return null;
  }

  return (
    <Link
      className={`${ui.primaryButton} min-h-10 px-4`}
      href={routes.createBlog}
    >
      Create Blog
    </Link>
  );
}
