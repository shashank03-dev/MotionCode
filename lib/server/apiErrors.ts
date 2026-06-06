import { NextResponse } from "next/server";

import type {
  ApiErrorResponse,
  ApiResponse,
  AppErrorCode,
} from "@/lib/contracts/errors";

export const API_ERROR_STATUS: Record<AppErrorCode, number> = {
  BILLING_REQUIRED: 402,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500,
  INVALID_MEDIA: 400,
  INVALID_REQUEST: 400,
  MODEL_FAILED: 502,
  NOT_FOUND: 404,
  QUOTA_EXCEEDED: 429,
  RATE_LIMITED: 429,
  SCHEMA_FAILED: 400,
  UNAUTHENTICATED: 401,
};

export class ApiError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(code: AppErrorCode, message: string, status = API_ERROR_STATUS[code]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError ||
    (Boolean(error) &&
      typeof error === "object" &&
      (error as { name?: unknown }).name === "ApiError" &&
      typeof (error as { code?: unknown }).code === "string" &&
      typeof (error as { status?: unknown }).status === "number")
  );
}

export function apiError(
  code: AppErrorCode,
  message: string,
  init: ResponseInit = {},
) {
  const body: ApiErrorResponse = { code, message, ok: false };
  return NextResponse.json(body, {
    ...init,
    status: init.status ?? API_ERROR_STATUS[code],
  });
}

export function apiSuccess<T>(data: T, init: ResponseInit = {}) {
  const body: ApiResponse<T> = { data, ok: true };
  return NextResponse.json(body, {
    ...init,
    status: init.status ?? 200,
  });
}
