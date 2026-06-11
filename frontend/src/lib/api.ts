import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: Json;
  auth?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal,
    });
  } catch (err) {
    throw new ApiError(
      "Cannot reach the backend. Make sure the API is running on " + API_URL,
      0,
      err,
    );
  }

  let data: unknown = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const detail =
      (data as { detail?: string } | null)?.detail ??
      (data as { error?: string } | null)?.error ??
      response.statusText;
    throw new ApiError(String(detail), response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<ApiOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: Json, opts?: Omit<ApiOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: Json, opts?: Omit<ApiOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  del: <T>(path: string, opts?: Omit<ApiOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
