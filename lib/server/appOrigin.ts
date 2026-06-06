export function getConfiguredAppOrigin(
  env: NodeJS.ProcessEnv = process.env,
) {
  const configuredUrl = env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    return null;
  }

  try {
    return new URL(configuredUrl).origin;
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
  }
}

export function getRequestAppOrigin(request: Request) {
  return getConfiguredAppOrigin() ?? new URL(request.url).origin;
}
