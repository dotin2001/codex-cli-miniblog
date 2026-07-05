import Link from "next/link";

const features = [
  {
    title: "Write",
    description: "Draft focused posts in a clean space built for quick publishing."
  },
  {
    title: "Read",
    description: "Browse recent stories with calm typography and simple navigation."
  },
  {
    title: "Discuss",
    description: "Keep conversations close to each post when comments arrive."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.24),transparent_34%),linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(250,245,255,1)_50%,rgba(237,233,254,1)_100%)]" />
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="text-xl font-bold tracking-tight text-purpleInk">
              MiniBlog
            </Link>
            <nav aria-label="Primary navigation" className="hidden items-center gap-8 text-sm font-medium text-slate-700 sm:flex">
              <a className="transition hover:text-purpleInk" href="#features">
                Features
              </a>
              <a className="transition hover:text-purpleInk" href="#start">
                Start
              </a>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div className="max-w-2xl">
              <h1 className="text-balance text-5xl font-bold tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
                Share small stories with a polished MiniBlog.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
                A clean starting point for posts, profiles, comments, and the auth flows that will connect to the MiniBlog API later.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#start"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
                >
                  Explore the app
                </a>
                <a
                  href="#features"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-purple-200 bg-white/80 px-6 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-white"
                >
                  View features
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white/78 p-4 shadow-2xl shadow-purple-950/12 backdrop-blur">
              <div className="rounded-xl bg-gradient-to-br from-purple-700 via-purple-500 to-fuchsia-400 p-1">
                <div className="rounded-lg bg-white p-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-sm font-semibold text-purpleInk">Today&apos;s draft</p>
                      <p className="text-xs text-slate-500">Ready to publish</p>
                    </div>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purpleInk">
                      New
                    </span>
                  </div>
                  <article className="space-y-4 py-6">
                    <h2 className="text-2xl font-bold tracking-normal text-slate-950">
                      Notes from a quiet product sprint
                    </h2>
                    <p className="leading-7 text-slate-600">
                      MiniBlog keeps writing, reading, and discussion close together so a small team can ship thoughts without ceremony.
                    </p>
                  </article>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {features.map((feature) => (
                      <div key={feature.title} className="rounded-lg bg-purple-50 p-4">
                        <h3 className="font-semibold text-purpleInk">{feature.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-purple-100 bg-white px-6 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title}>
              <h2 className="text-xl font-bold tracking-normal text-slate-950">{feature.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="start" className="bg-gradient-to-r from-purple-950 via-purple-800 to-purple-600 px-6 py-16 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-normal">Frontend shell is ready.</h2>
            <p className="mt-3 max-w-2xl text-purple-100">
              API calls are intentionally left out until the backend contract is implemented.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-purpleInk transition hover:bg-purple-50"
          >
            Back to top
          </Link>
        </div>
      </section>
    </main>
  );
}
