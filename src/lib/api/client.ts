import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type { ApiResponse, ApiError } from "@/types";

// ─── Error Codes ──────────────────────────────────────────────────

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ─── Custom Error Class ──────────────────────────────────────────

export class ApiClientError extends Error {
  code: ErrorCode;
  status: number;
  details?: Record<string, string[]>;

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.name = "ApiClientError";
    this.code = error.code as ErrorCode;
    this.status = status;
    this.details = error.details;
  }
}

// ─── Create Client ────────────────────────────────────────────────

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: "/api",
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  // ── Request Interceptor ──────────────────────────────────────

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // CSRF protection: ensure same-origin
      if (config.headers) {
        config.headers["X-Requested-With"] = "XMLHttpRequest";
      }

      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // ── Response Interceptor ─────────────────────────────────────

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiResponse>) => {
      // Re-throw canceled/aborted requests so callers can handle them
      if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
        throw error;
      }

      // Network error
      if (!error.response) {
        throw new ApiClientError(
          {
            code: ERROR_CODES.NETWORK_ERROR,
            message: "Network error. Please check your connection.",
          },
          0,
        );
      }

      const { status, data } = error.response;

      // Handle specific status codes
      switch (status) {
        case 401: {
          // Redirect to login on auth failure
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith("/login")) {
              window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
            }
          }
          throw new ApiClientError(
            data?.error ?? {
              code: ERROR_CODES.UNAUTHORIZED,
              message: "Please sign in to continue.",
            },
            status,
          );
        }
        case 403:
          throw new ApiClientError(
            data?.error ?? {
              code: ERROR_CODES.FORBIDDEN,
              message: "You do not have permission to perform this action.",
            },
            status,
          );
        case 404:
          throw new ApiClientError(
            data?.error ?? {
              code: ERROR_CODES.NOT_FOUND,
              message: "The requested resource was not found.",
            },
            status,
          );
        case 409:
          throw new ApiClientError(
            data?.error ?? {
              code: ERROR_CODES.CONFLICT,
              message: "A conflict occurred with the current state.",
            },
            status,
          );
        case 422:
          throw new ApiClientError(
            data?.error ?? {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: "Validation failed. Please check your input.",
            },
            status,
          );
        case 429:
          throw new ApiClientError(
            data?.error ?? {
              code: ERROR_CODES.RATE_LIMITED,
              message: "Too many requests. Please try again later.",
            },
            status,
          );
        default:
          throw new ApiClientError(
            data?.error ?? {
              code: ERROR_CODES.INTERNAL_ERROR,
              message: "Something went wrong. Please try again.",
            },
            status,
          );
      }
    },
  );

  return client;
};

// ─── Singleton ────────────────────────────────────────────────────

export const apiClient = createApiClient();

// ─── Typed Request Helpers ────────────────────────────────────────

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return response.data.data as T;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  return response.data.data as T;
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, data, config);
  return response.data.data as T;
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
  return response.data.data as T;
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return response.data.data as T;
}
