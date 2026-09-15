import Link from "next/link";
import type { Metadata } from "next";

import { LoginPanel } from "@/components/auth-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your MiniBlog account and continue writing.",
  robots: {
    index: false,
    follow: false
  }
};

export default function LoginPage() {
  return (
    <main className={ui.pageGradient}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link href={routes.home} className={ui.brand}>
            MiniBlog
          </Link>
          <nav aria-label="Login navigation" className="flex flex-wrap items-center justify-end gap-3">
            <ThemeToggle />
            <Link
              className={`${ui.secondaryButton} min-h-10 px-4`}
              href={routes.register}
            >
              Register
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="max-w-xl">
            <p className={ui.eyebrow}>
              MiniBlog account
            </p>
            <h1 className={`mt-4 text-4xl sm:text-5xl ${ui.title}`}>
              Continue writing from a focused workspace.
            </h1>
            <p className={`mt-5 text-lg leading-8 ${ui.muted}`}>
              Sign in to load your profile and open the development dashboard.
            </p>
          </div>
          <div className="w-full max-w-md justify-self-center lg:justify-self-end">
            <LoginPanel />
          </div>
        </section>
      </div>
    </main>
  );
}
