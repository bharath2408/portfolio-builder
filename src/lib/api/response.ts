import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { ApiResponse, ApiError } from "@/types";

// ─── Success Responses ────────────────────────────────────────────

export function successResponse<T>(
  data: T,
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { status },
  );
}

export function createdResponse<T>(
  data: T,
): NextResponse<ApiResponse<T>> {
  return successResponse(data, 201);
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// ─── Error Responses ──────────────────────────────────────────────

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>,
): NextResponse<ApiResponse<never>> {
  const error: ApiError = { code, message };
  if (details) error.details = details;

  return NextResponse.json(
    { success: false, error },
    { status },
  );
}

export function unauthorizedResponse(
  message = "Authentication required",
): NextResponse<ApiResponse<never>> {
  return errorResponse("UNAUTHORIZED", message, 401);
}

export function forbiddenResponse(
  message = "Insufficient permissions",
): NextResponse<ApiResponse<never>> {
  return errorResponse("FORBIDDEN", message, 403);
}

export function notFoundResponse(
  resource = "Resource",
): NextResponse<ApiResponse<never>> {
  return errorResponse("NOT_FOUND", `${resource} not found`, 404);
}

export function conflictResponse(
  message: string,
): NextResponse<ApiResponse<never>> {
  return errorResponse("CONFLICT", message, 409);
}

export function validationErrorResponse(
  error: ZodError,
): NextResponse<ApiResponse<never>> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }

  return errorResponse(
    "VALIDATION_ERROR",
    "Validation failed",
    422,
    details,
  );
}

export function rateLimitResponse(): NextResponse<ApiResponse<never>> {
  return errorResponse(
    "RATE_LIMITED",
    "Too many requests. Please try again later.",
    429,
  );
}

export function internalErrorResponse(
  message = "An unexpected error occurred",
): NextResponse<ApiResponse<never>> {
  return errorResponse("INTERNAL_ERROR", message, 500);
}

// ─── Error Handler Wrapper ────────────────────────────────────────

type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof AuthRequiredError) {
        return unauthorizedResponse();
      }
      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }

      console.error("[API Error]", error);
      return internalErrorResponse();
    }
  };
}

// ─── Auth Helper ──────────────────────────────────────────────────

import { auth } from "@/lib/auth";

export async function getAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new AuthRequiredError();
  }

  return user;
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}
