import { ui } from "@/lib/ui-styles";

export default function BlogDetailLoading() {
  return (
    <main className={ui.pageGradient}>
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div className={`h-7 w-28 rounded-full ${ui.skeletonPurple}`} />
          <div className={`h-10 w-24 rounded-lg shadow-sm ${ui.skeletonNeutral}`} />
        </div>
        <article className="py-12 sm:py-16">
          <div className={`h-4 w-32 rounded-full ${ui.skeletonPurple}`} />
          <div className={`mt-5 h-12 max-w-3xl rounded-lg ${ui.skeletonNeutral}`} />
          <div className={`mt-3 h-12 max-w-2xl rounded-lg ${ui.skeletonNeutral}`} />
          <div className={`mt-6 h-6 max-w-xl rounded-lg ${ui.skeletonNeutral}`} />
          <div className={`mt-8 p-6 ${ui.surface}`}>
            <div className={`h-4 rounded-lg ${ui.skeletonNeutral}`} />
            <div className={`mt-3 h-4 rounded-lg ${ui.skeletonNeutral}`} />
            <div className={`mt-3 h-4 w-4/5 rounded-lg ${ui.skeletonNeutral}`} />
            <div className={`mt-8 h-4 rounded-lg ${ui.skeletonNeutral}`} />
            <div className={`mt-3 h-4 rounded-lg ${ui.skeletonNeutral}`} />
            <div className={`mt-3 h-4 w-3/4 rounded-lg ${ui.skeletonNeutral}`} />
          </div>
        </article>
      </div>
    </main>
  );
}
