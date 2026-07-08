import Link from "next/link";

import { RegisterPanel } from "@/components/auth-panel";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_42%,#f5f3ff_100%)] px-6 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-purpleInk">
            MiniBlog
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
            href="/login"
          >
            Log in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
              Join MiniBlog
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
              Start with a clean identity for your posts.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Create your account, then log in when registration is complete.
            </p>
          </div>
          <div className="w-full max-w-md justify-self-center lg:justify-self-end">
            <RegisterPanel />
          </div>
        </section>
      </div>
    </main>
  );
}
