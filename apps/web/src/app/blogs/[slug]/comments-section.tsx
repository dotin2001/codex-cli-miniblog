"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  ApiRequestError,
  createComment,
  getComments
} from "@/lib/api/comments";
import type { Comment } from "@/lib/api/comments";

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

const ACCESS_TOKEN_STORAGE_KEY = "miniblog.dev.accessToken";

export function CommentsSection({ slug }: { slug: string }) {
  const accessToken = useAccessToken();
  const [removedToken, setRemovedToken] = useState(false);
  const [state, setState] = useState<CommentLoadState>({ status: "loading" });
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<FormError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeAccessToken = removedToken ? null : accessToken;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!activeAccessToken) {
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
      const { comment } = await createComment(
        slug,
        { content },
        activeAccessToken
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
      if (error instanceof ApiRequestError && error.status === 401) {
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        setRemovedToken(true);
      }

      setFormError(toFormError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-purpleInk">
            Comments
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-normal text-slate-950">
            Join the conversation
          </h2>
        </div>
        {state.status === "success" ? (
          <p className="text-sm font-semibold text-slate-600">
            {state.comments.length}{" "}
            {state.comments.length === 1 ? "comment" : "comments"}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <CommentForm
          accessToken={activeAccessToken}
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
          <CommentList comments={state.comments} />
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

function CommentForm({
  accessToken,
  content,
  error,
  isSubmitting,
  onChange,
  onSubmit
}: {
  accessToken: string | null;
  content: string;
  error: FormError | null;
  isSubmitting: boolean;
  onChange: (content: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!accessToken) {
    return (
      <div className="rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-slate-700">
        <span>Log in to add your comment.</span>{" "}
        <Link
          className="font-semibold text-purpleInk transition hover:text-purple-950"
          href="/login"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Add a comment</span>
        <textarea
          className="mt-2 min-h-28 w-full resize-y rounded-lg border border-purple-100 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
          disabled={isSubmitting}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Share your thoughts..."
          rows={4}
          value={content}
        />
        {error?.fields?.content ? (
          <span className="mt-2 block text-sm text-red-700">
            {error.fields.content}
          </span>
        ) : null}
      </label>
      {error ? <FormErrorMessage error={error} /> : null}
      <div className="flex justify-end">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-purpleInk px-5 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Posting..." : "Post comment"}
        </button>
      </div>
    </form>
  );
}

function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <ul className="grid gap-4">
      {comments.map((comment) => (
        <li
          className="rounded-lg border border-purple-100 bg-white p-4"
          key={comment.id}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-600">
            <span>{comment.author.name}</span>
            <span aria-hidden="true" className="text-purple-300">
              /
            </span>
            <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">
            {comment.content}
          </p>
        </li>
      ))}
    </ul>
  );
}

function LoadingState() {
  return (
    <div className="rounded-lg border border-purple-100 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-600">
      Loading comments...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-purple-100 bg-slate-50 px-4 py-5 text-sm text-slate-700">
      No comments yet. Start the conversation.
    </div>
  );
}

function FormErrorMessage({ error }: { error: FormError }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {error.message}
    </p>
  );
}

function useAccessToken(): string | null {
  return useSyncExternalStore(subscribeToAccessToken, getAccessTokenSnapshot, () => null);
}

function subscribeToAccessToken(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

function getAccessTokenSnapshot(): string | null {
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function toFormError(error: unknown): FormError {
  if (error instanceof ApiRequestError) {
    return {
      fields: error.fields,
      message: error.message
    };
  }

  return {
    message: "The comment could not be posted. Try again."
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
