import { ui } from "@/lib/ui-styles";

export default function BlogsLoading() {
  return (
    <main className={ui.pageGradient}>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div className={`h-7 w-28 rounded-full ${ui.skeletonPurple}`} />
          <div className={`h-10 w-20 rounded-lg shadow-sm ${ui.skeletonNeutral}`} />
        </div>
        <section className="py-12 sm:py-16">
          <div className="max-w-2xl">
            <div className={`h-4 w-24 rounded-full ${ui.skeletonPurple}`} />
            <div className={`mt-5 h-12 max-w-xl rounded-lg ${ui.skeletonNeutral}`} />
            <div className={`mt-4 h-6 max-w-lg rounded-lg ${ui.skeletonNeutral}`} />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <article
                className={`${ui.surface} p-6`}
                key={item}
              >
                <div className={`h-4 w-32 rounded-full ${ui.skeletonPurple}`} />
                <div className={`mt-5 h-7 rounded-lg ${ui.skeletonNeutral}`} />
                <div className={`mt-4 h-4 rounded-lg ${ui.skeletonNeutral}`} />
                <div className={`mt-2 h-4 w-3/4 rounded-lg ${ui.skeletonNeutral}`} />
                <div className={`mt-6 h-10 w-28 rounded-lg ${ui.skeletonPurple}`} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
