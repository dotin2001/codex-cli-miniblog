export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type ApiErrorFields = Record<string, string>;

export type ApiErrorPayload = {
  code: string;
  message: string;
  fields?: ApiErrorFields;
};

export type ApiErrorResponse = {
  error: ApiErrorPayload;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
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

type RequestOptions = {
  accessToken?: string;
  body?: unknown;
  method: "GET" | "POST";
};

type ApiRequestErrorOptions = ApiErrorPayload & {
  status: number;
};

const API_BASE_URL_ENV = "NEXT_PUBLIC_API_BASE_URL";

export class ApiRequestError extends Error {
  readonly code: string;
  readonly fields?: ApiErrorFields;
  readonly status: number;

  constructor({ code, fields, message, status }: ApiRequestErrorOptions) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}

export function register(input: RegisterRequest): Promise<AuthUserResponse> {
  return request<AuthUserResponse>("/auth/register", {
    body: input,
    method: "POST"
  });
}

export function login(input: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    body: input,
    method: "POST"
  });
}

export function refresh(): Promise<RefreshResponse> {
  return request<RefreshResponse>("/auth/refresh", {
    method: "POST"
  });
}

export function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>("/auth/logout", {
    method: "POST"
  });
}

export function getMe(accessToken: string): Promise<AuthUserResponse> {
  return request<AuthUserResponse>("/auth/me", {
    accessToken,
    method: "GET"
  });
}

async function request<TResponse>(
  path: string,
  { accessToken, body, method }: RequestOptions
): Promise<TResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers: getHeaders({ accessToken, hasBody: body !== undefined }),
    method
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw toApiRequestError(response.status, payload);
  }

  return payload as TResponse;
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new ApiRequestError({
      code: "CONFIGURATION_ERROR",
      message: `${API_BASE_URL_ENV} is not configured.`,
      status: 0
    });
  }

  return baseUrl.replace(/\/+$/, "");
}

function getHeaders({
  accessToken,
  hasBody
}: {
  accessToken?: string;
  hasBody: boolean;
}): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json"
  };

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function parseJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError({
      code: "INVALID_JSON_RESPONSE",
      message: "The API returned an invalid JSON response.",
      status: response.status
    });
  }
}

function toApiRequestError(status: number, payload: unknown): ApiRequestError {
  if (isApiErrorResponse(payload)) {
    return new ApiRequestError({
      code: payload.error.code,
      fields: payload.error.fields,
      message: payload.error.message,
      status
    });
  }

  return new ApiRequestError({
    code: "UNKNOWN_API_ERROR",
    message: "The API request failed.",
    status
  });
}

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return false;
  }

  return (
    typeof payload.error.code === "string" &&
    typeof payload.error.message === "string" &&
    (payload.error.fields === undefined || isStringRecord(payload.error.fields))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringRecord(value: unknown): value is ApiErrorFields {
  return isRecord(value) && Object.values(value).every((field) => typeof field === "string");
}
