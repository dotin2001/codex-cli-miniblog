"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  ApiRequestError,
  AuthUser,
  getMe,
  login,
  logout,
  register
} from "@/lib/api/auth";

type AuthMode = "login" | "register";

type AuthFormError = {
  fields?: Record<string, string>;
  message: string;
};

const ACCESS_TOKEN_STORAGE_KEY = "miniblog.dev.accessToken";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<AuthFormError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const accessToken = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (!accessToken) {
      return;
    }

    getMe(accessToken)
      .then(({ user: currentUser }) => {
        setUser(currentUser);
      })
      .catch(() => {
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      });
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await login({
        email: getFormValue(formData, "email"),
        password: getFormValue(formData, "password")
      });

      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, response.accessToken);
      setUser(response.user);
    } catch (caughtError) {
      setError(toFormError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await register({
        email: getFormValue(formData, "email"),
        name: getFormValue(formData, "name"),
        password: getFormValue(formData, "password")
      });

      form.reset();
      setMode("login");
      setStatusMessage(`${response.user.name} is registered. Log in to continue.`);
    } catch (caughtError) {
      setError(toFormError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    clearFeedback();
    setIsSubmitting(true);

    try {
      await logout();
    } catch (caughtError) {
      setError(toFormError(caughtError));
    } finally {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      setUser(null);
      setIsSubmitting(false);
    }
  }

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    clearFeedback();
  }

  function clearFeedback() {
    setError(null);
    setStatusMessage(null);
  }

  if (user) {
    return (
      <section aria-label="Signed in account" className="rounded-lg bg-white p-5">
        <div className="border-b border-slate-100 pb-4">
          <p className="text-sm font-semibold text-purpleInk">Signed in</p>
          <h2 className="mt-2 text-2xl font-bold tracking-normal text-slate-950">
            {user.name}
          </h2>
          <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
        </div>
        {error ? <AuthError error={error} /> : null}
        <button
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          onClick={handleLogout}
          type="button"
        >
          {isSubmitting ? "Signing out..." : "Sign out"}
        </button>
      </section>
    );
  }

  return (
    <section aria-label="Authentication" className="rounded-lg bg-white p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <p className="text-sm font-semibold text-purpleInk">
            {mode === "login" ? "Welcome back" : "Create account"}
          </p>
          <p className="text-xs text-slate-500">MiniBlog auth</p>
        </div>
        <div className="grid grid-cols-2 rounded-lg bg-purple-50 p-1 text-xs font-semibold text-purpleInk">
          <button
            className={getModeButtonClass(mode === "login")}
            disabled={isSubmitting}
            onClick={() => handleModeChange("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={getModeButtonClass(mode === "register")}
            disabled={isSubmitting}
            onClick={() => handleModeChange("register")}
            type="button"
          >
            Register
          </button>
        </div>
      </div>

      {mode === "login" ? (
        <AuthForm
          error={error}
          isSubmitting={isSubmitting}
          mode="login"
          onSubmit={handleLogin}
          statusMessage={statusMessage}
        />
      ) : (
        <AuthForm
          error={error}
          isSubmitting={isSubmitting}
          mode="register"
          onSubmit={handleRegister}
          statusMessage={statusMessage}
        />
      )}
    </section>
  );
}

function AuthForm({
  error,
  isSubmitting,
  mode,
  onSubmit,
  statusMessage
}: {
  error: AuthFormError | null;
  isSubmitting: boolean;
  mode: AuthMode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  statusMessage: string | null;
}) {
  const isLogin = mode === "login";

  return (
    <form className="space-y-4 pt-5" onSubmit={onSubmit}>
      {!isLogin ? (
        <TextField
          autoComplete="name"
          error={error?.fields?.name}
          label="Name"
          name="name"
          type="text"
        />
      ) : null}
      <TextField
        autoComplete="email"
        error={error?.fields?.email}
        label="Email"
        name="email"
        type="email"
      />
      <TextField
        autoComplete={isLogin ? "current-password" : "new-password"}
        error={error?.fields?.password}
        label="Password"
        name="password"
        type="password"
      />
      {statusMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {statusMessage}
        </p>
      ) : null}
      {error ? <AuthError error={error} /> : null}
      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Working..." : isLogin ? "Log in" : "Create account"}
      </button>
    </form>
  );
}

function TextField({
  autoComplete,
  error,
  label,
  name,
  type
}: {
  autoComplete: string;
  error?: string;
  label: string;
  name: string;
  type: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        autoComplete={autoComplete}
        className="mt-2 min-h-12 w-full rounded-lg border border-purple-100 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
        name={name}
        required
        type={type}
      />
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function AuthError({ error }: { error: AuthFormError }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {error.message}
    </p>
  );
}

function getModeButtonClass(isActive: boolean): string {
  const baseClass =
    "rounded-md px-3 py-2 transition disabled:cursor-not-allowed disabled:opacity-70";

  if (isActive) {
    return `${baseClass} bg-white shadow-sm`;
  }

  return `${baseClass} hover:bg-white/70`;
}

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function toFormError(error: unknown): AuthFormError {
  if (error instanceof ApiRequestError) {
    return {
      fields: error.fields,
      message: error.message
    };
  }

  return {
    message: "Something went wrong. Try again."
  };
}
