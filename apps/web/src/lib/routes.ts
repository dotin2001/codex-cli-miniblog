export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  blogs: "/blogs",
  blog: (slug: string) => `/blogs/${slug}`,
  myBlogs: "/dashboard/blogs",
  createBlog: "/dashboard/blogs/new",
  editBlog: (slug: string) => `/dashboard/blogs/${slug}/edit`,
} as const;
