export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  blogs: "/blogs",
  blogsByTag: (slug: string) => `/blogs?tag=${encodeURIComponent(slug)}`,
  blog: (slug: string) => `/blogs/${slug}`,
  myBlogs: "/dashboard/blogs",
  createBlog: "/dashboard/blogs/new",
  editBlog: (slug: string) => `/dashboard/blogs/${slug}/edit`,
} as const;
