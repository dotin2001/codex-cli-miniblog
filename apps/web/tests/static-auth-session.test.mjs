import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const sourceRoot = new URL("../src/", import.meta.url);

async function readSource(path) {
  return readFile(new URL(path, sourceRoot), "utf8");
}

test("auth session retries authenticated operations through the refresh endpoint", async () => {
  const sessionSource = await readSource("lib/auth-session.ts");

  assert.match(sessionSource, /import \{ refresh \} from "@\/lib\/api\/auth";/);
  assert.match(sessionSource, /export async function runWithFreshAccessToken/);
  assert.match(sessionSource, /await refresh\(\)/);
  assert.match(sessionSource, /status: 401/);
});

test("protected blog and comment screens use the shared auth session helper", async () => {
  const protectedSources = await Promise.all([
    readSource("components/auth-panel.tsx"),
    readSource("app/dashboard/blogs/page.tsx"),
    readSource("app/dashboard/blogs/new/page.tsx"),
    readSource("app/dashboard/blogs/[slug]/edit/edit-blog-client.tsx"),
    readSource("app/blogs/[slug]/blog-owner-actions.tsx"),
    readSource("app/blogs/[slug]/comments-section.tsx"),
  ]);

  for (const source of protectedSources) {
    assert.match(source, /@\/lib\/auth-session/);
  }

  assert.equal(
    protectedSources.some((source) => source.includes("runWithFreshAccessToken")),
    true,
  );
});

test("route helpers keep dashboard blog routes centralized", async () => {
  const routesSource = await readSource("lib/routes.ts");

  assert.match(routesSource, /myBlogs: "\/dashboard\/blogs"/);
  assert.match(routesSource, /createBlog: "\/dashboard\/blogs\/new"/);
  assert.match(
    routesSource,
    /editBlog: \(slug: string\) => `\/dashboard\/blogs\/\$\{slug\}\/edit`/,
  );
});
