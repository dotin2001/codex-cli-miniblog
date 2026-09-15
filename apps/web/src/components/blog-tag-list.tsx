import Link from "next/link";

import type { BlogTag } from "@/lib/api/blogs";
import { routes } from "@/lib/routes";

export function BlogTagList({
  className = "",
  linked = false,
  tags,
}: {
  className?: string;
  linked?: boolean;
  tags: BlogTag[];
}) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) =>
        linked ? (
          <Link
            className={tagClassName}
            href={routes.blogsByTag(tag.slug)}
            key={tag.id}
          >
            #{tag.name}
          </Link>
        ) : (
          <span className={tagClassName} key={tag.id}>
            #{tag.name}
          </span>
        ),
      )}
    </div>
  );
}

const tagClassName =
  "inline-flex min-h-7 max-w-full items-center rounded-full border border-purple-200 bg-purple-50 px-3 text-xs font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-100 dark:border-purple-300/30 dark:bg-purple-950/40 dark:text-purple-100 dark:hover:border-purple-200/50 dark:hover:bg-purple-900/50";
