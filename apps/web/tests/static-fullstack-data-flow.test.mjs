import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const repoRoot = new URL("../../../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, repoRoot), "utf8");
}

test("full-stack map covers frontend routes and API helpers", async () => {
  const mapSource = await readProjectFile("docs/fullstack-data-flow.md");

  for (const token of [
    "/register",
    "/login",
    "/dashboard",
    "/blogs",
    "/blogs/[slug]",
    "/dashboard/blogs",
    "/dashboard/blogs/new",
    "/dashboard/blogs/[slug]/edit",
    "register()",
    "login()",
    "refresh()",
    "logout()",
    "getMe()",
    "getBlogs",
    "getBlog",
    "getMyBlogs",
    "getMyBlog",
    "createBlog",
    "updateBlog",
    "deleteBlog",
    "getComments",
    "createComment",
    "updateComment",
    "deleteComment",
  ]) {
    assert.match(mapSource, new RegExp(escapeRegExp(token)));
  }
});

test("full-stack map covers auth-session behavior and route helpers", async () => {
  const mapSource = await readProjectFile("docs/fullstack-data-flow.md");
  const authSessionSource = await readProjectFile("apps/web/src/lib/auth-session.ts");
  const routesSource = await readProjectFile("apps/web/src/lib/routes.ts");

  assert.match(authSessionSource, /runWithFreshAccessToken/);
  assert.match(authSessionSource, /refreshStoredAccessToken/);
  assert.match(routesSource, /myBlogs: "\/dashboard\/blogs"/);
  assert.match(routesSource, /createBlog: "\/dashboard\/blogs\/new"/);

  for (const token of [
    "runWithFreshAccessToken()",
    "refreshStoredAccessToken()",
    "setStoredAccessToken()",
    "clearStoredAccessToken()",
    "NEXT_PUBLIC_API_BASE_URL",
    "routes.ts",
    "401 Unauthorized",
  ]) {
    assert.match(mapSource, new RegExp(escapeRegExp(token)));
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
