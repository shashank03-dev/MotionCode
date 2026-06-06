const DEFAULT_ANALYSIS_ERROR = "Analysis is temporarily unavailable.";
const DAILY_ANALYSIS_LIMIT_ERROR = "Daily analysis limit reached.";
const GEMINI_PROVIDER_ERROR =
  "The analysis provider returned an error. Try again with fewer frames.";

export function publicErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/daily analysis limit/i.test(message)) {
    return DAILY_ANALYSIS_LIMIT_ERROR;
  }

  if (/gemini/i.test(message) && !/gemini_api_key/i.test(message)) {
    return GEMINI_PROVIDER_ERROR;
  }

  return DEFAULT_ANALYSIS_ERROR;
}
