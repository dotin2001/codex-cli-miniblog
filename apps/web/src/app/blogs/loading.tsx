export default function BlogsLoading() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#f5f3ff_100%)] px-6 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div className="h-7 w-28 rounded-full bg-purple-100" />
          <div className="h-10 w-20 rounded-lg bg-white shadow-sm" />
        </div>
        <section className="py-12 sm:py-16">
          <div className="max-w-2xl">
            <div className="h-4 w-24 rounded-full bg-purple-100" />
            <div className="mt-5 h-12 max-w-xl rounded-lg bg-slate-100" />
            <div className="mt-4 h-6 max-w-lg rounded-lg bg-slate-100" />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <article
                className="rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10"
                key={item}
              >
                <div className="h-4 w-32 rounded-full bg-purple-100" />
                <div className="mt-5 h-7 rounded-lg bg-slate-100" />
                <div className="mt-4 h-4 rounded-lg bg-slate-100" />
                <div className="mt-2 h-4 w-3/4 rounded-lg bg-slate-100" />
                <div className="mt-6 h-10 w-28 rounded-lg bg-purple-100" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
