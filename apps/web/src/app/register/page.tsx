import Link from "next/link";
import type { Metadata } from "next";

import { RegisterPanel } from "@/components/auth-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a MiniBlog account and start sharing focused posts.",
  robots: {
    index: false,
    follow: false
  }
};

export default function RegisterPage() {
  return (
    <main className={ui.pageGradient}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link href={routes.home} className={ui.brand}>
            MiniBlog
          </Link>
          <nav aria-label="Register navigation" className="flex flex-wrap items-center justify-end gap-3">
            <ThemeToggle />
            <Link
              className={`${ui.secondaryButton} min-h-10 px-4`}
              href={routes.login}
            >
              Log in
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="max-w-xl">
            <p className={ui.eyebrow}>
              Join MiniBlog
            </p>
            <h1 className={`mt-4 text-4xl sm:text-5xl ${ui.title}`}>
              Start with a clean identity for your posts.
            </h1>
            <p className={`mt-5 text-lg leading-8 ${ui.muted}`}>
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
