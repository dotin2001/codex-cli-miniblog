import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const appRoot = new URL("../", import.meta.url);
const sourceRoot = new URL("../src/", import.meta.url);
const repoRoot = new URL("../../../", import.meta.url);

async function readAppFile(path) {
  return readFile(new URL(path, appRoot), "utf8");
}

async function readSource(path) {
  return readFile(new URL(path, sourceRoot), "utf8");
}

async function readProjectFile(path) {
  return readFile(new URL(path, repoRoot), "utf8");
}

test("Tailwind uses class-based dark mode", async () => {
  const configSource = await readAppFile("tailwind.config.ts");

  assert.match(configSource, /darkMode:\s*"class"/);
});

test("theme preference supports light, dark, system, and system fallback", async () => {
  const themeSource = await readSource("lib/theme.ts");

  assert.match(themeSource, /THEME_STORAGE_KEY = "miniblog\.themePreference"/);

  for (const preference of ["light", "dark", "system"]) {
    assert.match(themeSource, new RegExp(`"${preference}"`));
  }

  assert.match(themeSource, /export function isThemePreference/);
  assert.match(themeSource, /return isThemePreference\(storedPreference\) \? storedPreference : "system"/);
  assert.match(themeSource, /prefers-color-scheme: dark/);
  assert.match(themeSource, /root\.classList\.toggle\("dark"/);
});

test("theme control persists selection and responds to system changes", async () => {
  const toggleSource = await readSource("components/theme-toggle.tsx");

  assert.match(toggleSource, /setStoredThemePreference\(nextPreference\)/);
  assert.match(toggleSource, /applyThemePreference\(nextPreference\)/);
  assert.match(toggleSource, /addEventListener\("change", handleThemeChange\)/);
  assert.match(toggleSource, /THEME_CHANGE_EVENT/);
  assert.match(toggleSource, /aria-label="Theme preference"/);
  assert.match(toggleSource, /aria-pressed=\{isSelected\}/);
});

test("representative frontend surfaces expose theme control and dark styling", async () => {
  const uiSource = await readSource("lib/ui-styles.ts");
  const layoutSource = await readSource("app/layout.tsx");
  const routeSources = await Promise.all([
    readSource("app/page.tsx"),
    readSource("app/login/page.tsx"),
    readSource("app/register/page.tsx"),
    readSource("app/blogs/page.tsx"),
    readSource("app/blogs/[slug]/page.tsx"),
    readSource("app/dashboard/page.tsx"),
    readSource("app/dashboard/blogs/page.tsx"),
    readSource("app/dashboard/blogs/new/page.tsx"),
    readSource("app/dashboard/blogs/[slug]/edit/edit-blog-client.tsx"),
  ]);

  assert.match(layoutSource, /getThemeBootstrapScript/);
  assert.equal((uiSource.match(/dark:/g) ?? []).length >= 25, true);

  for (const source of routeSources) {
    assert.match(source, /ThemeToggle/);
  }
});

test("theme behavior is documented without API or database storage", async () => {
  const architectureSource = await readProjectFile("docs/architecture.md");

  assert.match(architectureSource, /miniblog\.themePreference/);
  assert.match(architectureSource, /localStorage/);
  assert.match(architectureSource, /`dark` class/);
});
