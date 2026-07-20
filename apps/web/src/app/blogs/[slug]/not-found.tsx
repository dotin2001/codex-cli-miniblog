import Link from "next/link";

import { routes } from "@/lib/routes";

export default function BlogNotFound() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#f5f3ff_100%)] px-6 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Link href={routes.home} className="text-xl font-bold tracking-tight text-purpleInk">
            MiniBlog
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
            href={routes.blogs}
          >
            All blogs
          </Link>
        </header>
        <section className="py-12 sm:py-16">
          <div className="rounded-xl border border-purple-100 bg-white p-8 text-center shadow-2xl shadow-purple-950/10">
            <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
              Blog not found
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
              This post is not available.
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-slate-700">
              It may have been removed, unpublished, or the link may be incorrect.
            </p>
            <Link
              className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
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
