import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

export default function BlogNotFound() {
  return (
    <main className={ui.pageGradient}>
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href={routes.home} className={ui.brand}>
            MiniBlog
          </Link>
          <nav aria-label="Not found navigation" className="flex flex-wrap items-center justify-end gap-3">
            <ThemeToggle />
            <Link
              className={`${ui.secondaryButton} min-h-10 px-4`}
              href={routes.blogs}
            >
              All blogs
            </Link>
          </nav>
        </header>
        <section className="py-12 sm:py-16">
          <div className={`p-8 text-center ${ui.surface}`}>
            <p className={ui.eyebrow}>
              Blog not found
            </p>
            <h1 className={`mt-3 text-3xl ${ui.title}`}>
              This post is not available.
            </h1>
            <p className={`mx-auto mt-3 max-w-lg text-base leading-7 ${ui.text}`}>
              It may have been removed, unpublished, or the link may be incorrect.
            </p>
            <Link
              className={`mt-6 min-h-10 px-4 ${ui.primaryButton}`}
              href={routes.blogs}
            >
              Back to blogs
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
