"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

type BlogTitleSearchFormProps = {
  activeTag: string | null;
  activeTitle: string | null;
};

export function BlogTitleSearchForm({
  activeTag,
  activeTitle,
}: BlogTitleSearchFormProps) {
  const router = useRouter();
  const clearHref = activeTag ? routes.blogsByTag(activeTag) : routes.blogs;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const query = new URLSearchParams();

    if (activeTag) {
      query.set("tag", activeTag);
    }

    if (title) {
      query.set("title", title);
    }

    const queryString = query.toString();
    router.push(queryString ? `${routes.blogs}?${queryString}` : routes.blogs);
  }

  return (
    <form
      action={routes.blogs}
      className={`mt-8 p-4 ${ui.surface}`}
      onSubmit={handleSubmit}
    >
      <label className={ui.label} htmlFor="blog-title-search">
        Search by title
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          className={`${ui.input} min-h-11 flex-1 px-4`}
          defaultValue={activeTitle ?? ""}
          id="blog-title-search"
          name="title"
          placeholder="Post title"
          type="search"
        />
        {activeTag ? <input name="tag" type="hidden" value={activeTag} /> : null}
        <div className="flex flex-wrap gap-3">
          <button className={`${ui.primaryButton} min-h-11 px-5`} type="submit">
            Search
          </button>
          {activeTitle ? (
            <Link
              className={`${ui.secondaryButton} min-h-11 px-5`}
              href={clearHref}
            >
              Clear
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}
