"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { getMe } from "@/lib/api/auth";
import {
  ApiRequestError,
  createComment,
  deleteComment,
  getComments,
  updateComment
} from "@/lib/api/comments";
import type { Comment } from "@/lib/api/comments";
import {
  clearStoredAccessToken,
  isUnauthorizedApiError,
  runWithFreshAccessToken,
  useAccessToken,
} from "@/lib/auth-session";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

type CommentLoadState =
  | {
      comments: Comment[];
      status: "success";
    }
  | {
      status: "loading";
    }
  | {
      message: string;
      status: "error";
    };

type FormError = {
  fields?: Record<string, string>;
  message: string;
};

type CommentActionError = FormError & {
  commentId: number;
};

type EditState = {
  commentId: number;
  content: string;
};

export function CommentsSection({ slug }: { slug: string }) {
  const accessToken = useAccessToken();
  const [removedToken, setRemovedToken] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [state, setState] = useState<CommentLoadState>({ status: "loading" });
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<FormError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [actionError, setActionError] = useState<CommentActionError | null>(null);
  const [savingCommentId, setSavingCommentId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const canTrySession = !removedToken;

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      setState({ status: "loading" });

      try {
        const { comments } = await getComments(slug);

        if (isMounted) {
          setState({ comments, status: "success" });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            message: getCommentsErrorMessage(error),
            status: "error"
          });
        }
      }
    }

    void loadComments();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      if (removedToken) {
        setCurrentUserId(null);
        return;
      }

      try {
        const { user } = await runWithFreshAccessToken((accessToken) =>
          getMe(accessToken)
        );

        if (isMounted) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          clearStoredAccessToken();
          setRemovedToken(true);
        }

        if (isMounted) {
          setCurrentUserId(null);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [accessToken, removedToken]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (removedToken) {
      setFormError({ message: "Log in to add a comment." });
      return;
    }

    if (!content.trim()) {
      setFormError({
        fields: { content: "Content is required." },
        message: "Invalid comment request."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { comment } = await runWithFreshAccessToken(
        (accessToken) => createComment(slug, { content }, accessToken)
      );

      setContent("");
      setState((currentState) => {
        if (currentState.status === "success") {
          return {
            comments: [...currentState.comments, comment],
            status: "success"
          };
        }

        return {
          comments: [comment],
          status: "success"
        };
      });
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        clearStoredAccessToken();
        setRemovedToken(true);
      }

      setFormError(toFormError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveComment(commentId: number) {
    setActionError(null);

    if (removedToken) {
      setActionError({
        commentId,
        message: "Log in to edit this comment."
      });
      return;
    }

    if (!editState || editState.commentId !== commentId) {
      return;
    }

    if (!editState.content.trim()) {
      setActionError({
        commentId,
        fields: { content: "Content cannot be blank." },
        message: "Invalid comment request."
      });
      return;
    }

    setSavingCommentId(commentId);

    try {
      const { comment } = await runWithFreshAccessToken(
        (accessToken) =>
          updateComment(commentId, { content: editState.content }, accessToken)
      );

      setState((currentState) => {
        if (currentState.status !== "success") {
          return currentState;
        }

        return {
          comments: currentState.comments.map((currentComment) =>
            currentComment.id === comment.id ? comment : currentComment
          ),
          status: "success"
        };
      });
      setEditState(null);
    } catch (error) {
      handleCommentActionError(
        commentId,
        error,
        "The comment could not be updated."
      );
    } finally {
      setSavingCommentId(null);
    }
  }

  async function handleDeleteComment(commentId: number) {
    setActionError(null);

    if (removedToken) {
      setActionError({
        commentId,
        message: "Log in to delete this comment."
      });
      return;
    }

    const confirmed = window.confirm(
      "Delete this comment? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingCommentId(commentId);

    try {
      await runWithFreshAccessToken((accessToken) =>
        deleteComment(commentId, accessToken)
      );

      setState((currentState) => {
        if (currentState.status !== "success") {
          return currentState;
        }

        return {
          comments: currentState.comments.filter(
            (comment) => comment.id !== commentId
          ),
          status: "success"
        };
      });

      if (editState?.commentId === commentId) {
        setEditState(null);
      }
    } catch (error) {
      handleCommentActionError(
        commentId,
        error,
        "The comment could not be deleted."
      );
    } finally {
      setDeletingCommentId(null);
    }
  }

  function handleCommentActionError(
    commentId: number,
    error: unknown,
    fallbackMessage: string
  ) {
    if (isUnauthorizedApiError(error)) {
      clearStoredAccessToken();
      setRemovedToken(true);
    }

    setActionError({
      ...toFormError(error, fallbackMessage),
      commentId
    });
  }

  return (
    <section className={`mt-8 p-6 sm:p-8 ${ui.surface}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={ui.eyebrow}>
            Comments
          </p>
          <h2 className={`mt-2 text-2xl ${ui.title}`}>
            Join the conversation
          </h2>
        </div>
        {state.status === "success" ? (
          <p className={`text-sm font-semibold ${ui.muted}`}>
            {state.comments.length}{" "}
            {state.comments.length === 1 ? "comment" : "comments"}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <CommentForm
          canTrySession={canTrySession}
          content={content}
          error={formError}
          isSubmitting={isSubmitting}
          onChange={setContent}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="mt-8">
        {state.status === "loading" ? (
          <LoadingState />
        ) : state.status === "error" ? (
          <ErrorState message={state.message} />
        ) : state.comments.length > 0 ? (
          <CommentList
            actionError={actionError}
            comments={state.comments}
            currentUserId={currentUserId}
            deletingCommentId={deletingCommentId}
            editState={editState}
            savingCommentId={savingCommentId}
            onCancelEdit={() => {
              setActionError(null);
              setEditState(null);
            }}
            onChangeEditContent={(nextContent) => {
              setEditState((currentState) =>
                currentState ? { ...currentState, content: nextContent } : null
              );
            }}
            onDelete={handleDeleteComment}
            onEdit={(comment) => {
              setActionError(null);
              setEditState({ commentId: comment.id, content: comment.content });
            }}
            onSave={handleSaveComment}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

function CommentForm({
  canTrySession,
  content,
  error,
  isSubmitting,
  onChange,
  onSubmit
}: {
  canTrySession: boolean;
  content: string;
  error: FormError | null;
  isSubmitting: boolean;
  onChange: (content: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!canTrySession) {
    return (
      <div className={`px-4 py-3 text-sm ${ui.softSurface}`}>
        <span>Log in to add your comment.</span>{" "}
        <Link
          className="font-semibold text-purpleInk transition hover:text-purple-950 dark:text-purple-200 dark:hover:text-purple-100"
          href={routes.login}
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className="block">
        <span className={ui.label}>Add a comment</span>
        <textarea
          className={`mt-2 min-h-28 w-full resize-y px-4 py-3 leading-6 ${ui.input}`}
          disabled={isSubmitting}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Share your thoughts..."
          rows={4}
          value={content}
        />
        {error?.fields?.content ? (
          <span className={ui.fieldError}>
            {error.fields.content}
          </span>
        ) : null}
      </label>
      {error ? <FormErrorMessage error={error} /> : null}
      <div className="flex justify-end">
        <button
          className={`${ui.primaryButton} min-h-11 px-5`}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Posting..." : "Post comment"}
        </button>
      </div>
    </form>
  );
}

function CommentList({
  actionError,
  comments,
  currentUserId,
  deletingCommentId,
  editState,
  savingCommentId,
  onCancelEdit,
  onChangeEditContent,
  onDelete,
  onEdit,
  onSave
}: {
  actionError: CommentActionError | null;
  comments: Comment[];
  currentUserId: number | null;
  deletingCommentId: number | null;
  editState: EditState | null;
  savingCommentId: number | null;
  onCancelEdit: () => void;
  onChangeEditContent: (content: string) => void;
  onDelete: (commentId: number) => void;
  onEdit: (comment: Comment) => void;
  onSave: (commentId: number) => void;
}) {
  return (
    <ul className="grid gap-4">
      {comments.map((comment) => (
        <CommentItem
          actionError={
            actionError?.commentId === comment.id ? actionError : null
          }
          comment={comment}
          currentUserId={currentUserId}
          editState={editState?.commentId === comment.id ? editState : null}
          isDeleting={deletingCommentId === comment.id}
          isSaving={savingCommentId === comment.id}
          key={comment.id}
          onCancelEdit={onCancelEdit}
          onChangeEditContent={onChangeEditContent}
          onDelete={onDelete}
          onEdit={onEdit}
          onSave={onSave}
        />
      ))}
    </ul>
  );
}

function CommentItem({
  actionError,
  comment,
  currentUserId,
  editState,
  isDeleting,
  isSaving,
  onCancelEdit,
  onChangeEditContent,
  onDelete,
  onEdit,
  onSave
}: {
  actionError: FormError | null;
  comment: Comment;
  currentUserId: number | null;
  editState: EditState | null;
  isDeleting: boolean;
  isSaving: boolean;
  onCancelEdit: () => void;
  onChangeEditContent: (content: string) => void;
  onDelete: (commentId: number) => void;
  onEdit: (comment: Comment) => void;
  onSave: (commentId: number) => void;
}) {
  const isAuthor = currentUserId === comment.authorId;

  return (
    <li className="rounded-lg border border-purple-100 bg-white p-4 transition-colors dark:border-purple-300/20 dark:bg-slate-950/70">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold ${ui.muted}`}>
          <span>{comment.author.name}</span>
          <span aria-hidden="true" className="text-purple-300 dark:text-purple-500">
            /
          </span>
          <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
        </div>
        {isAuthor ? (
          <div className="flex flex-wrap gap-2">
            <button
              className={`${ui.secondaryButton} min-h-9 px-3`}
              disabled={isDeleting || isSaving}
              onClick={() => onEdit(comment)}
              type="button"
            >
              Edit
            </button>
            <button
              className={`${ui.destructiveButton} min-h-9 px-3`}
              disabled={isDeleting || isSaving}
              onClick={() => onDelete(comment.id)}
              type="button"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        ) : null}
      </div>

      {editState ? (
        <div className="mt-3 grid gap-3">
          <label className="block">
            <span className="sr-only">Edit comment</span>
            <textarea
              className={`w-full resize-y px-4 py-3 leading-6 ${ui.input}`}
              disabled={isSaving || isDeleting}
              onChange={(event) => onChangeEditContent(event.target.value)}
              rows={4}
              value={editState.content}
            />
            {actionError?.fields?.content ? (
              <span className={ui.fieldError}>
                {actionError.fields.content}
              </span>
            ) : null}
          </label>
          {actionError ? <FormErrorMessage error={actionError} /> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              className={`${ui.secondaryButton} min-h-10 px-4`}
              disabled={isSaving || isDeleting}
              onClick={onCancelEdit}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`${ui.primaryButton} min-h-10 px-4`}
              disabled={isSaving || isDeleting}
              onClick={() => onSave(comment.id)}
              type="button"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800 dark:text-slate-200">
            {comment.content}
          </p>
          {actionError ? <FormErrorMessage error={actionError} /> : null}
        </>
      )}
    </li>
  );
}

function LoadingState() {
  return (
    <div className={`px-4 py-5 text-sm font-semibold ${ui.neutralSurface}`}>
      Loading comments...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={`px-4 py-3 text-sm ${ui.errorBox}`}>
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={`px-4 py-5 text-sm ${ui.neutralSurface}`}>
      No comments yet. Start the conversation.
    </div>
  );
}

function FormErrorMessage({ error }: { error: FormError }) {
  return (
    <p className={`px-4 py-3 text-sm ${ui.errorBox}`}>
      {error.message}
    </p>
  );
}

function toFormError(
  error: unknown,
  fallbackMessage = "The comment could not be posted. Try again."
): FormError {
  if (error instanceof ApiRequestError) {
    return {
      fields: error.fields,
      message: error.message
    };
  }

  return {
    message: fallbackMessage
  };
}

function getCommentsErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  return "Comments could not be loaded. Try again later.";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}
