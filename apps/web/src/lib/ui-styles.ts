export const ui = {
  pageGradient:
    "min-h-screen bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#f5f3ff_100%)] px-6 py-6 text-slate-950 transition-colors sm:px-8 lg:px-10 dark:bg-[linear-gradient(135deg,#020617_0%,#111827_48%,#24113f_100%)] dark:text-slate-100",
  pagePlain:
    "min-h-screen bg-white px-6 py-6 text-slate-950 transition-colors sm:px-8 lg:px-10 dark:bg-slate-950 dark:text-slate-100",
  brand:
    "text-xl font-bold tracking-tight text-purpleInk transition hover:text-purpleGlow dark:text-purple-200 dark:hover:text-purple-100",
  primaryButton:
    "inline-flex items-center justify-center rounded-lg bg-purpleInk text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-purple-300 dark:text-slate-950 dark:shadow-black/30 dark:hover:bg-purple-200",
  secondaryButton:
    "inline-flex items-center justify-center rounded-lg border border-purple-200 bg-white text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-purple-300/30 dark:bg-slate-950/80 dark:text-purple-100 dark:hover:border-purple-200/50 dark:hover:bg-slate-900",
  destructiveButton:
    "inline-flex items-center justify-center rounded-lg border border-red-200 bg-white text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-400/40 dark:bg-red-950/30 dark:text-red-200 dark:hover:border-red-300/60 dark:hover:bg-red-950/60",
  surface:
    "rounded-xl border border-purple-100 bg-white shadow-2xl shadow-purple-950/10 transition-colors dark:border-purple-300/20 dark:bg-slate-900/90 dark:shadow-black/30",
  softSurface:
    "rounded-lg border border-purple-100 bg-purple-50 text-slate-700 transition-colors dark:border-purple-300/20 dark:bg-purple-950/30 dark:text-slate-200",
  neutralSurface:
    "rounded-lg border border-purple-100 bg-slate-50 text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  eyebrow:
    "text-sm font-semibold uppercase tracking-wide text-purpleInk dark:text-purple-200",
  title: "font-bold tracking-normal text-slate-950 dark:text-white",
  text: "text-slate-700 dark:text-slate-300",
  muted: "text-slate-600 dark:text-slate-400",
  label: "text-sm font-semibold text-slate-800 dark:text-slate-200",
  input:
    "rounded-lg border border-purple-100 bg-white text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 dark:border-purple-300/20 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-purple-300 dark:focus:ring-purple-300/20",
  fieldError: "mt-2 block text-sm text-red-700 dark:text-red-300",
  errorBox:
    "rounded-lg border border-red-200 bg-red-50 text-red-800 transition-colors dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-200",
  errorPanel:
    "rounded-xl border border-red-200 bg-red-50 text-red-900 shadow-2xl shadow-red-950/5 transition-colors dark:border-red-400/40 dark:bg-red-950/40 dark:text-red-100 dark:shadow-black/20",
  successBox:
    "rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 transition-colors dark:border-emerald-400/40 dark:bg-emerald-950/40 dark:text-emerald-200",
  warningBadge:
    "inline-flex min-h-7 items-center rounded-full border border-amber-200 bg-amber-50 px-3 text-xs font-bold uppercase tracking-wide text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-200",
  successBadge:
    "inline-flex min-h-7 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold uppercase tracking-wide text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-950/40 dark:text-emerald-200",
  divider: "border-slate-100 dark:border-slate-800",
  skeletonPurple: "bg-purple-100 dark:bg-purple-300/20",
  skeletonNeutral: "bg-slate-100 dark:bg-slate-800"
} as const;
