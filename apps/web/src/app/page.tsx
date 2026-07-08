import Link from "next/link";

const highlights = [
  {
    title: "Focused writing",
    description: "A calm surface for drafting and sharing concise posts."
  },
  {
    title: "Account ready",
    description: "Login, registration, and profile lookup are wired to the MiniBlog API."
  },
  {
    title: "Built to grow",
    description: "The shell leaves room for posts, comments, and profiles as the app expands."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#f5f3ff_100%)] px-6 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="text-xl font-bold tracking-tight text-purpleInk">
              MiniBlog
            </Link>
            <nav aria-label="Primary navigation" className="flex items-center gap-3">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-purple-200 bg-white px-4 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="hidden min-h-10 items-center justify-center rounded-lg bg-purpleInk px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950 sm:inline-flex"
                href="/register"
              >
                Register
              </Link>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.04fr_0.96fr] lg:py-16">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
                MiniBlog
              </p>
              <h1 className="mt-4 text-balance text-5xl font-bold tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
                Share small stories with a polished MiniBlog.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
                A clean starting point for posts, profiles, comments, and auth flows that connect to the MiniBlog API.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
                  href="/login"
                >
                  Login
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-purple-200 bg-white px-6 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50"
                  href="/register"
                >
                  Register
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-2xl shadow-purple-950/10">
              <div className="rounded-lg bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-purple-200">MiniBlog</p>
                    <p className="mt-1 text-2xl font-bold tracking-normal">Auth workspace</p>
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
                      <h2 className="text-base font-semibold text-white">{item.title}</h2>
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
