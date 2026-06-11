export const DEFAULT_AUTH_NEXT_PATH = "/app";

const SAME_SITE_BASE_URL = "https://motioncode.local";

export function normalizeAuthNextPath(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_AUTH_NEXT_PATH;
  }

  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_AUTH_NEXT_PATH;
  }

  try {
    const url = new URL(trimmed, SAME_SITE_BASE_URL);
    if (url.origin !== SAME_SITE_BASE_URL) {
      return DEFAULT_AUTH_NEXT_PATH;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_NEXT_PATH;
  }
}

export function loginPathForNext(value: string | null | undefined) {
  const nextPath = normalizeAuthNextPath(value);

  if (nextPath === DEFAULT_AUTH_NEXT_PATH) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function buildAuthCallbackUrl(origin: string, nextPath: string) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", normalizeAuthNextPath(nextPath));

  return callbackUrl.toString();
}

export function getAuthRedirectOrigin(currentOrigin: string) {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_VERCEL_URL) ??
    normalizeOrigin(currentOrigin) ??
    currentOrigin
  );
}

function normalizeOrigin(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const absoluteUrl = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(absoluteUrl).origin;
  } catch {
    return null;
  }
}
