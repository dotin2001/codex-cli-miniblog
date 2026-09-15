import Link from "next/link";

import { DashboardPanel } from "@/components/auth-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

export default function DashboardPage() {
  return (
    <main className={ui.pagePlain}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link
            href={routes.blogs}
            className={ui.brand}
          >
            MiniBlog
          </Link>
          <nav
            aria-label="Dashboard navigation"
            className="flex flex-wrap items-center justify-end gap-3"
          >
            <ThemeToggle />
            <Link
              className={`${ui.secondaryButton} min-h-10 px-4`}
              href={routes.login}
            >
              Login
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="max-w-xl">
            <p className={ui.eyebrow}>
              Account
            </p>
            <h1 className={`mt-4 text-4xl sm:text-5xl ${ui.title}`}>
              Your MiniBlog dashboard.
            </h1>
            <p className={`mt-5 text-lg leading-8 ${ui.muted}`}>
              Review the authenticated user returned by the MiniBlog API.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className={`${ui.primaryButton} min-h-12 px-6`}
                href={routes.createBlog}
              >
                Create New Blog
              </Link>
              <Link
                className={`${ui.secondaryButton} min-h-12 px-6`}
                href={routes.myBlogs}
              >
                My Blogs
              </Link>
            </div>
          </div>
          <div className="w-full max-w-md justify-self-center lg:justify-self-end">
            <DashboardPanel />
          </div>
        </section>
      </div>
    </main>
  );
}
