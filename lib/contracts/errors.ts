export const APP_ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INVALID_MEDIA",
  "INVALID_REQUEST",
  "QUOTA_EXCEEDED",
  "RATE_LIMITED",
  "MODEL_FAILED",
  "SCHEMA_FAILED",
  "BILLING_REQUIRED",
  "INTERNAL_ERROR",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export type ApiErrorResponse = {
  ok: false;
  code: AppErrorCode;
  message: string;
};

export type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
