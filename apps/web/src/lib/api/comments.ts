import { request } from "./client";

export {
  ApiRequestError
} from "./client";

export type {
  ApiErrorFields,
  ApiErrorPayload,
  ApiErrorResponse
} from "./client";

export type CommentAuthor = {
  id: number;
  name: string;
};

export type Comment = {
  author: CommentAuthor;
  authorId: number;
  blogId: number;
  content: string;
  createdAt: string;
  id: number;
  updatedAt: string;
};

export type CommentListResponse = {
  comments: Comment[];
};

export type CommentResponse = {
  comment: Comment;
};

export type CreateCommentPayload = {
  content: string;
};

export type UpdateCommentPayload = {
  content: string;
};

export type DeleteCommentResponse = {
  message: string;
};

export function getComments(slug: string): Promise<CommentListResponse> {
  return request<CommentListResponse>(
    `/blogs/${encodeURIComponent(slug)}/comments`,
    {
      method: "GET"
    }
  );
}

export function createComment(
  slug: string,
  input: CreateCommentPayload,
  accessToken: string
): Promise<CommentResponse> {
  return request<CommentResponse>(
    `/blogs/${encodeURIComponent(slug)}/comments`,
    {
      accessToken,
      body: input,
      method: "POST"
    }
  );
}

export function updateComment(
  commentId: number,
  input: UpdateCommentPayload,
  accessToken: string
): Promise<CommentResponse> {
  return request<CommentResponse>(`/comments/${commentId}`, {
    accessToken,
    body: input,
    method: "PATCH"
  });
}

export function deleteComment(
  commentId: number,
  accessToken: string
): Promise<DeleteCommentResponse> {
  return request<DeleteCommentResponse>(`/comments/${commentId}`, {
    accessToken,
    method: "DELETE"
  });
}
