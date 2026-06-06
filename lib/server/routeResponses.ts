import { z } from "zod";

import { apiError, ApiError, isApiError } from "@/lib/server/apiErrors";
import type { InternalAdminDenied } from "@/lib/server/internalAdmin";

export function apiErrorFromUnknown(
  error: unknown,
  fallbackMessage = "Request failed.",
) {
  if (isApiError(error)) {
    return apiError(error.code, error.message, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    return apiError("INVALID_REQUEST", error.issues[0]?.message ?? "Invalid request.");
  }

  if (error instanceof ApiError) {
    return apiError(error.code, error.message, { status: error.status });
  }

  return apiError("INTERNAL_ERROR", fallbackMessage);
}

export function internalAdminDeniedResponse(decision: InternalAdminDenied) {
  return apiError(decision.code, decision.message);
}
