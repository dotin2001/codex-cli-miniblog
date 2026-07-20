import Link from "next/link";

import { DashboardPanel } from "@/components/auth-panel";
import { routes } from "@/lib/routes";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link
            href={routes.blogs}
            className="text-xl font-bold tracking-tight text-purpleInk"
          >
            MiniBlog
          </Link>
          <nav
            aria-label="Dashboard navigation"
            className="flex items-center gap-3"
          >
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
              href={routes.login}
            >
              Login
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
              Account
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
              Your MiniBlog dashboard.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Review the authenticated user returned by the MiniBlog API.
            </p>
            <Link
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
              href={routes.createBlog}
            >
              Create New Blog
            </Link>
          </div>
          <div className="w-full max-w-md justify-self-center lg:justify-self-end">
            <DashboardPanel />
          </div>
        </section>
      </div>
    </main>
  );
}
