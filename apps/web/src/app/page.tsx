import Link from "next/link";
import type { Metadata } from "next";

import { ThemeToggle } from "@/components/theme-toggle";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Read public posts, create an account, and start sharing concise stories on MiniBlog."
};

const highlights = [
  {
    title: "Focused writing",
    description: "A calm surface for drafting and sharing concise posts.",
  },
  {
    title: "Account ready",
    description:
      "Login, registration, and profile lookup are wired to the MiniBlog API.",
  },
  {
    title: "Built to grow",
    description:
      "The shell leaves room for posts, comments, and profiles as the app expands.",
  },
];

export default function Home() {
  return (
    <main className={ui.pageGradient}>
      <section>
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
          <header className="flex items-center justify-between gap-4">
            <Link
              href={routes.blogs}
              className={ui.brand}
            >
              MiniBlog
            </Link>
            <nav
              aria-label="Primary navigation"
              className="flex flex-wrap items-center justify-end gap-3"
            >
              <ThemeToggle />
              <Link
                className={`${ui.secondaryButton} min-h-10 px-4`}
                href={routes.login}
              >
                Login
              </Link>
              <Link
                className={`${ui.primaryButton} hidden min-h-10 px-4 sm:inline-flex`}
                href={routes.register}
              >
                Register
              </Link>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.04fr_0.96fr] lg:py-16">
            <div className="max-w-2xl">
              <p className={ui.eyebrow}>
                MiniBlog
              </p>
              <h1 className={`mt-4 text-balance text-5xl sm:text-6xl lg:text-7xl ${ui.title}`}>
                Share small stories with a polished MiniBlog.
              </h1>
              <p className={`mt-6 max-w-xl text-lg leading-8 ${ui.text}`}>
                A clean starting point for posts, profiles, comments, and auth
                flows that connect to the MiniBlog API.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  className={`${ui.primaryButton} min-h-12 px-6`}
                  href={routes.login}
                >
                  Login
                </Link>
                <Link
                  className={`${ui.secondaryButton} min-h-12 px-6`}
                  href={routes.register}
                >
                  Register
                </Link>
              </div>
            </div>

            <div className={`${ui.surface} p-5`}>
              <div className="rounded-lg bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-purple-200">
                      MiniBlog
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-normal">
                      Auth workspace
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-emerald-950">
                    Ready
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  {highlights.map((item) => (
                    <div
                      className="rounded-lg border border-white/10 bg-white/5 p-4"
                      key={item.title}
                    >
                      <h2 className="text-base font-semibold text-white">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
