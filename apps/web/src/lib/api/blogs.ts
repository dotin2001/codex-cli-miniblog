import { request } from "./client";

export {
  ApiRequestError
} from "./client";

export type {
  ApiErrorFields,
  ApiErrorPayload,
  ApiErrorResponse
} from "./client";

export type BlogStatus = "draft" | "published";

export type BlogAuthor = {
  id: number;
  name: string;
};

export type Blog = {
  author?: BlogAuthor;
  authorId: number;
  content: string;
  createdAt: string;
  excerpt: string | null;
  id: number;
  slug: string;
  status: BlogStatus;
  title: string;
  updatedAt: string;
};

export type Pagination = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type BlogListParams = {
  page?: number;
  perPage?: number;
};

export type BlogListResponse = {
  blogs: Blog[];
  pagination: Pagination;
};

export type BlogResponse = {
  blog: Blog;
};

export type CreateBlogPayload = {
  content: string;
  excerpt?: string;
  status?: BlogStatus;
  title: string;
};

export type UpdateBlogPayload = {
  content?: string;
  excerpt?: string | null;
  status?: BlogStatus;
  title?: string;
};

export type DeleteBlogResponse = {
  message: string;
};

export function getBlogs(params: BlogListParams = {}): Promise<BlogListResponse> {
  return request<BlogListResponse>(withQuery("/blogs", params), {
    method: "GET"
  });
}

export function getBlog(slug: string): Promise<BlogResponse> {
  return request<BlogResponse>(`/blogs/${encodeURIComponent(slug)}`, {
    method: "GET"
  });
}

export function getMyBlog(
  slug: string,
  accessToken: string
): Promise<BlogResponse> {
  return request<BlogResponse>(`/blogs/${encodeURIComponent(slug)}/mine`, {
    accessToken,
    method: "GET"
  });
}

export function createBlog(
  input: CreateBlogPayload,
  accessToken: string
): Promise<BlogResponse> {
  return request<BlogResponse>("/blogs", {
    accessToken,
    body: input,
    method: "POST"
  });
}

export function updateBlog(
  slug: string,
  input: UpdateBlogPayload,
  accessToken: string
): Promise<BlogResponse> {
  return request<BlogResponse>(`/blogs/${encodeURIComponent(slug)}`, {
    accessToken,
    body: input,
    method: "PATCH"
  });
}

export function deleteBlog(
  slug: string,
  accessToken: string
): Promise<DeleteBlogResponse> {
  return request<DeleteBlogResponse>(`/blogs/${encodeURIComponent(slug)}`, {
    accessToken,
    method: "DELETE"
  });
}

function withQuery(path: string, params: BlogListParams): string {
  const query = new URLSearchParams();

  if (params.page !== undefined) {
    query.set("page", String(params.page));
  }

  if (params.perPage !== undefined) {
    query.set("perPage", String(params.perPage));
  }

  const queryString = query.toString();

  return queryString ? `${path}?${queryString}` : path;
}
