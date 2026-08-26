"use client";

import { useSyncExternalStore } from "react";

import { refresh } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";

export const ACCESS_TOKEN_STORAGE_KEY = "miniblog.dev.accessToken";

const ACCESS_TOKEN_CHANGE_EVENT = "miniblog:access-token-change";

export function useAccessToken(): string | null {
  return useSyncExternalStore(
    subscribeToAccessToken,
    getStoredAccessToken,
    () => null,
  );
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setStoredAccessToken(accessToken: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  notifyAccessTokenChange();
}

export function clearStoredAccessToken(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  notifyAccessTokenChange();
}

export async function refreshStoredAccessToken(): Promise<string | null> {
  try {
    const { accessToken } = await refresh();
    setStoredAccessToken(accessToken);

    return accessToken;
  } catch {
    clearStoredAccessToken();

    return null;
  }
}

export async function runWithFreshAccessToken<T>(
  operation: (accessToken: string) => Promise<T>,
): Promise<T> {
  const accessToken = getStoredAccessToken() ?? (await refreshStoredAccessToken());

  if (!accessToken) {
    throw new ApiRequestError({
      code: "UNAUTHORIZED",
      message: "Log in to continue.",
      status: 401,
    });
  }

  try {
    return await operation(accessToken);
  } catch (error) {
    if (!isUnauthorizedApiError(error)) {
      throw error;
    }

    const refreshedAccessToken = await refreshStoredAccessToken();
    if (!refreshedAccessToken) {
      throw error;
    }

    return operation(refreshedAccessToken);
  }
}

export function isUnauthorizedApiError(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 401;
}

function subscribeToAccessToken(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(ACCESS_TOKEN_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(ACCESS_TOKEN_CHANGE_EVENT, onStoreChange);
  };
}

function notifyAccessTokenChange(): void {
  window.dispatchEvent(new Event(ACCESS_TOKEN_CHANGE_EVENT));
}
