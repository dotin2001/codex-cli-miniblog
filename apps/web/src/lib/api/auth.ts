import { request } from "./client";

export {
  ApiRequestError
} from "./client";

export type {
  ApiErrorFields,
  ApiErrorPayload,
  ApiErrorResponse
} from "./client";

export type AuthUser = {
  email: string;
  id: number;
  name: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthUserResponse = {
  user: AuthUser;
};

export type LoginResponse = AuthUserResponse & {
  accessToken: string;
};

export type RefreshResponse = {
  accessToken: string;
};

export type LogoutResponse = {
  message: string;
};

export type RegisterRequest = {
  email: string;
  name: string;
  password: string;
};

export function getMe(accessToken: string): Promise<AuthUserResponse> {
  return request<AuthUserResponse>("/auth/me", {
    accessToken,
    method: "GET"
  });
}

export function login(input: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    body: input,
    method: "POST"
  });
}

export function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>("/auth/logout", {
    method: "POST"
  });
}

export function refresh(): Promise<RefreshResponse> {
  return request<RefreshResponse>("/auth/refresh", {
    method: "POST"
  });
}

export function register(input: RegisterRequest): Promise<AuthUserResponse> {
  return request<AuthUserResponse>("/auth/register", {
    body: input,
    method: "POST"
  });
}
