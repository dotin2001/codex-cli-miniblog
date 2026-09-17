export const THEME_STORAGE_KEY = "miniblog.themePreference";
export const THEME_CHANGE_EVENT = "miniblog.themePreferenceChange";

export const themePreferences = ["light", "dark", "system"] as const;

export type ThemePreference = (typeof themePreferences)[number];
export type ResolvedTheme = Exclude<ThemePreference, "system">;

const darkMediaQuery = "(prefers-color-scheme: dark)";

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    themePreferences.includes(value as ThemePreference)
  );
}

export function getStoredThemePreference(
  storage = getBrowserStorage()
): ThemePreference {
  if (!storage) {
    return "system";
  }

  const storedPreference = storage.getItem(THEME_STORAGE_KEY);

  return isThemePreference(storedPreference) ? storedPreference : "system";
}

export function setStoredThemePreference(
  preference: ThemePreference,
  storage = getBrowserStorage()
) {
  storage?.setItem(THEME_STORAGE_KEY, preference);
}

export function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia(darkMediaQuery).matches
  ) {
    return "dark";
  }

  return "light";
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemTheme: ResolvedTheme
): ResolvedTheme {
  return preference === "system" ? systemTheme : preference;
}

export function applyThemePreference(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveThemePreference(preference, getSystemTheme());

  if (typeof document !== "undefined") {
    const root = document.documentElement;

    root.classList.toggle("dark", resolvedTheme === "dark");
    root.dataset.theme = preference;
    root.dataset.resolvedTheme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }

  return resolvedTheme;
}

export function getThemeBootstrapScript(): string {
  return `
    (() => {
      try {
        const key = "${THEME_STORAGE_KEY}";
        const stored = window.localStorage.getItem(key);
        const preference =
          stored === "light" || stored === "dark" || stored === "system"
            ? stored
            : "system";
        const systemTheme = window.matchMedia("${darkMediaQuery}").matches
          ? "dark"
          : "light";
        const resolvedTheme = preference === "system" ? systemTheme : preference;
        const root = document.documentElement;

        root.classList.toggle("dark", resolvedTheme === "dark");
        root.dataset.theme = preference;
        root.dataset.resolvedTheme = resolvedTheme;
        root.style.colorScheme = resolvedTheme;
      } catch (error) {
        document.documentElement.style.colorScheme = "light";
      }
    })();
  `;
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
