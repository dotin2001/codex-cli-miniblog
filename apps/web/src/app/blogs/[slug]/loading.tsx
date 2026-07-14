export default function BlogDetailLoading() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#f5f3ff_100%)] px-6 py-6 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div className="h-7 w-28 rounded-full bg-purple-100" />
          <div className="h-10 w-24 rounded-lg bg-white shadow-sm" />
        </div>
        <article className="py-12 sm:py-16">
          <div className="h-4 w-32 rounded-full bg-purple-100" />
          <div className="mt-5 h-12 max-w-3xl rounded-lg bg-slate-100" />
          <div className="mt-3 h-12 max-w-2xl rounded-lg bg-slate-100" />
          <div className="mt-6 h-6 max-w-xl rounded-lg bg-slate-100" />
          <div className="mt-8 rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10">
            <div className="h-4 rounded-lg bg-slate-100" />
            <div className="mt-3 h-4 rounded-lg bg-slate-100" />
            <div className="mt-3 h-4 w-4/5 rounded-lg bg-slate-100" />
            <div className="mt-8 h-4 rounded-lg bg-slate-100" />
            <div className="mt-3 h-4 rounded-lg bg-slate-100" />
            <div className="mt-3 h-4 w-3/4 rounded-lg bg-slate-100" />
          </div>
        </article>
      </div>
    </main>
  );
}
