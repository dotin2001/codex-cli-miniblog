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
import {
  clearStoredAccessToken,
  runWithFreshAccessToken,
  setStoredAccessToken
} from "@/lib/auth-session";
import { routes } from "@/lib/routes";
import { ui } from "@/lib/ui-styles";

type AuthFormError = {
  fields?: Record<string, string>;
  message: string;
};

type DashboardState =
  | { status: "loading"; user: null; error: null }
  | { status: "unauthenticated"; user: null; error: AuthFormError | null }
  | { status: "authenticated"; user: AuthUser; error: AuthFormError | null };

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

      setStoredAccessToken(response.accessToken);
      router.push(routes.dashboard);
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
      <p className={`mt-6 text-center text-sm ${ui.muted}`}>
        Need an account?{" "}
        <Link className="font-semibold text-purpleInk hover:text-purpleGlow dark:text-purple-200 dark:hover:text-purple-100" href={routes.register}>
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
          <p className={`px-4 py-3 text-sm ${ui.successBox}`}>
            {registeredUser.name} is registered. You can log in now.
          </p>
        ) : null}
        {error ? <AuthError error={error} /> : null}
        <SubmitButton isSubmitting={isSubmitting} loadingLabel="Creating account...">
          Create account
        </SubmitButton>
      </form>
      <p className={`mt-6 text-center text-sm ${ui.muted}`}>
        Already registered?{" "}
        <Link className="font-semibold text-purpleInk hover:text-purpleGlow dark:text-purple-200 dark:hover:text-purple-100" href={routes.login}>
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
      try {
        const { user } = await runWithFreshAccessToken((accessToken) =>
          getMe(accessToken)
        );

        if (isMounted) {
          setState({ error: null, status: "authenticated", user });
        }
      } catch (caughtError) {
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
      router.push(routes.login);
    } catch (caughtError) {
      setState({
        error: toFormError(caughtError),
        status: "unauthenticated",
        user: null
      });
    } finally {
      clearStoredAccessToken();
      setIsSigningOut(false);
    }
  }

  if (state.status === "loading") {
    return (
      <AuthCard eyebrow="Dashboard" title="Loading your account">
        <div className="space-y-4">
          <div className={`h-4 w-36 rounded-full ${ui.skeletonPurple}`} />
          <div className={`h-20 rounded-lg ${ui.skeletonNeutral}`} />
          <div className={`h-12 rounded-lg ${ui.skeletonPurple}`} />
        </div>
      </AuthCard>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <AuthCard eyebrow="Dashboard" title="Sign in required">
        {state.error ? <AuthError error={state.error} /> : null}
        <Link
          className={`mt-6 min-h-12 w-full px-6 ${ui.primaryButton}`}
          href={routes.login}
        >
          Go to login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow="Dashboard" title={`Hello, ${state.user.name}`}>
      <dl className="grid gap-4 rounded-xl border border-purple-100 bg-purple-50/70 p-4 transition-colors dark:border-purple-300/20 dark:bg-purple-950/30">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Name
          </dt>
          <dd className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{state.user.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Email
          </dt>
          <dd className="mt-1 break-all text-base font-semibold text-slate-950 dark:text-white">
            {state.user.email}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            User ID
          </dt>
          <dd className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{state.user.id}</dd>
        </div>
      </dl>
      {state.error ? <div className="mt-5"><AuthError error={state.error} /></div> : null}
      <button
        className={`mt-6 min-h-12 w-full px-6 ${ui.secondaryButton}`}
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
    <section className={`p-6 sm:p-8 ${ui.surface}`}>
      <div className={`mb-6 border-b pb-5 ${ui.divider}`}>
        <p className="text-sm font-semibold text-purpleInk dark:text-purple-200">{eyebrow}</p>
        <h1 className={`mt-2 text-3xl ${ui.title}`}>{title}</h1>
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
      <span className={ui.label}>{label}</span>
      <input
        autoComplete={autoComplete}
        className={`mt-2 min-h-12 w-full px-4 ${ui.input}`}
        name={name}
        required
        type={type}
      />
      {error ? <span className={ui.fieldError}>{error}</span> : null}
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
      className={`min-h-12 w-full px-6 ${ui.primaryButton}`}
      disabled={isSubmitting}
      type="submit"
    >
      {isSubmitting ? loadingLabel : children}
    </button>
  );
}

function AuthError({ error }: { error: AuthFormError }) {
  return (
    <p className={`px-4 py-3 text-sm ${ui.errorBox}`}>
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
