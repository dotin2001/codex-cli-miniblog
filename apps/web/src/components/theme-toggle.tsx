"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  applyThemePreference,
  THEME_CHANGE_EVENT,
  getStoredThemePreference,
  setStoredThemePreference,
  themePreferences,
  THEME_STORAGE_KEY
} from "@/lib/theme";
import type { ThemePreference } from "@/lib/theme";

const labels: Record<ThemePreference, string> = {
  dark: "Dark",
  light: "Light",
  system: "System"
};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const preference = useSyncExternalStore(
    subscribeToThemePreference,
    getThemePreferenceSnapshot,
    getServerThemePreferenceSnapshot
  );

  useEffect(() => {
    applyThemePreference(preference);
  }, [preference]);

  function handleSelect(nextPreference: ThemePreference) {
    setStoredThemePreference(nextPreference);
    applyThemePreference(nextPreference);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <div
      aria-label="Theme preference"
      className={`inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg border border-purple-200 bg-white p-1 shadow-sm transition-colors dark:border-purple-300/30 dark:bg-slate-950 ${className}`}
      role="group"
    >
      {themePreferences.map((option) => {
        const isSelected = preference === option;

        return (
          <button
            aria-pressed={isSelected}
            className={
              isSelected
                ? "min-h-8 rounded-md bg-purpleInk px-3 text-xs font-bold text-white transition dark:bg-purple-300 dark:text-slate-950"
                : "min-h-8 rounded-md px-3 text-xs font-semibold text-slate-600 transition hover:bg-purple-50 hover:text-purpleInk focus:outline-none focus:ring-2 focus:ring-purple-300 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-purple-100"
            }
            key={option}
            onClick={() => handleSelect(option)}
            title={`Use ${labels[option].toLowerCase()} theme`}
            type="button"
          >
            {labels[option]}
          </button>
        );
      })}
    </div>
  );
}

function subscribeToThemePreference(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function handleThemeChange() {
    applyThemePreference(getStoredThemePreference());
    onChange();
  }

  function handleStorage(event: StorageEvent) {
    if (event.key !== THEME_STORAGE_KEY) {
      return;
    }

    handleThemeChange();
  }

  media.addEventListener("change", handleThemeChange);
  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

  return () => {
    media.removeEventListener("change", handleThemeChange);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  };
}

function getThemePreferenceSnapshot(): ThemePreference {
  return getStoredThemePreference();
}

function getServerThemePreferenceSnapshot(): ThemePreference {
  return "system";
}
