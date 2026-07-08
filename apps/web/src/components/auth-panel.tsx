"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  ApiRequestError,
  AuthUser,
  getMe,
  login,
  logout,
  register
} from "@/lib/api/auth";

type AuthFormError = {
  fields?: Record<string, string>;
  message: string;
};

type DashboardState =
  | { status: "loading"; user: null; error: null }
  | { status: "unauthenticated"; user: null; error: AuthFormError | null }
  | { status: "authenticated"; user: AuthUser; error: AuthFormError | null };

const ACCESS_TOKEN_STORAGE_KEY = "miniblog.dev.accessToken";

export function LoginPanel() {
  const router = useRouter();
  const [error, setError] = useState<AuthFormError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await login({
        email: getFormValue(formData, "email"),
        password: getFormValue(formData, "password")
      });

      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, response.accessToken);
      router.push("/dashboard");
    } catch (caughtError) {
      setError(toFormError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard eyebrow="Welcome back" title="Log in to MiniBlog">
      <form className="space-y-5" onSubmit={handleLogin}>
        <TextField
          autoComplete="email"
          error={error?.fields?.email}
          label="Email"
          name="email"
          type="email"
        />
        <TextField
          autoComplete="current-password"
          error={error?.fields?.password}
          label="Password"
          name="password"
          type="password"
        />
        {error ? <AuthError error={error} /> : null}
        <SubmitButton isSubmitting={isSubmitting} loadingLabel="Logging in...">
          Log in
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Need an account?{" "}
        <Link className="font-semibold text-purpleInk hover:text-purpleGlow" href="/register">
          Register
        </Link>
      </p>
    </AuthCard>
  );
}

export function RegisterPanel() {
  const [error, setError] = useState<AuthFormError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<AuthUser | null>(null);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setRegisteredUser(null);
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
      setRegisteredUser(response.user);
    } catch (caughtError) {
      setError(toFormError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard eyebrow="Create account" title="Register for MiniBlog">
      <form className="space-y-5" onSubmit={handleRegister}>
        <TextField
          autoComplete="name"
          error={error?.fields?.name}
          label="Name"
          name="name"
          type="text"
        />
        <TextField
          autoComplete="email"
          error={error?.fields?.email}
          label="Email"
          name="email"
          type="email"
        />
        <TextField
          autoComplete="new-password"
          error={error?.fields?.password}
          label="Password"
          name="password"
          type="password"
        />
        {registeredUser ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {registeredUser.name} is registered. You can log in now.
          </p>
        ) : null}
        {error ? <AuthError error={error} /> : null}
        <SubmitButton isSubmitting={isSubmitting} loadingLabel="Creating account...">
          Create account
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link className="font-semibold text-purpleInk hover:text-purpleGlow" href="/login">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}

export function DashboardPanel() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({
    error: null,
    status: "loading",
    user: null
  });
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      const accessToken = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

      if (!accessToken) {
        if (isMounted) {
          setState({
            error: {
              message: "Log in to view your dashboard."
            },
            status: "unauthenticated",
            user: null
          });
        }
        return;
      }

      try {
        const { user } = await getMe(accessToken);

        if (isMounted) {
          setState({ error: null, status: "authenticated", user });
        }
      } catch (caughtError) {
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);

        if (isMounted) {
          setState({
            error: toFormError(caughtError),
            status: "unauthenticated",
            user: null
          });
        }
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    setIsSigningOut(true);
    setState((currentState) => ({ ...currentState, error: null }));

    try {
      await logout();
      router.push("/login");
    } catch (caughtError) {
      setState({
        error: toFormError(caughtError),
        status: "unauthenticated",
        user: null
      });
    } finally {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      setIsSigningOut(false);
    }
  }

  if (state.status === "loading") {
    return (
      <AuthCard eyebrow="Dashboard" title="Loading your account">
        <div className="space-y-4">
          <div className="h-4 w-36 rounded-full bg-purple-100" />
          <div className="h-20 rounded-lg bg-slate-100" />
          <div className="h-12 rounded-lg bg-purple-100" />
        </div>
      </AuthCard>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <AuthCard eyebrow="Dashboard" title="Sign in required">
        {state.error ? <AuthError error={state.error} /> : null}
        <Link
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950"
          href="/login"
        >
          Go to login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow="Dashboard" title={`Hello, ${state.user.name}`}>
      <dl className="grid gap-4 rounded-xl border border-purple-100 bg-purple-50/70 p-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Name
          </dt>
          <dd className="mt-1 text-base font-semibold text-slate-950">{state.user.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
          </dt>
          <dd className="mt-1 break-all text-base font-semibold text-slate-950">
            {state.user.email}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            User ID
          </dt>
          <dd className="mt-1 text-base font-semibold text-slate-950">{state.user.id}</dd>
        </div>
      </dl>
      {state.error ? <div className="mt-5"><AuthError error={state.error} /></div> : null}
      <button
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-purple-200 bg-white px-6 text-sm font-semibold text-purpleInk transition hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSigningOut}
        onClick={handleLogout}
        type="button"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
    </AuthCard>
  );
}

function AuthCard({
  children,
  eyebrow,
  title
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-purple-100 bg-white p-6 shadow-2xl shadow-purple-950/10 sm:p-8">
      <div className="mb-6 border-b border-slate-100 pb-5">
        <p className="text-sm font-semibold text-purpleInk">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950">{title}</h1>
      </div>
      {children}
    </section>
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

function SubmitButton({
  children,
  isSubmitting,
  loadingLabel
}: {
  children: ReactNode;
  isSubmitting: boolean;
  loadingLabel: string;
}) {
  return (
    <button
      className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-purpleInk px-6 text-sm font-semibold text-white shadow-lg shadow-purple-900/20 transition hover:bg-purple-950 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isSubmitting}
      type="submit"
    >
      {isSubmitting ? loadingLabel : children}
    </button>
  );
}

function AuthError({ error }: { error: AuthFormError }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {error.message}
    </p>
  );
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
