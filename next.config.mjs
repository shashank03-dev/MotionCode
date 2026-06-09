const fallbackSupabaseOrigin = "https://*.supabase.co";

export function buildContentSecurityPolicy(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
) {
  const supabaseOrigin = normalizeOrigin(supabaseUrl) ?? fallbackSupabaseOrigin;
  const supabaseWebsocketOrigin = supabaseOrigin.startsWith("https://")
    ? supabaseOrigin.replace("https://", "wss://")
    : "wss://*.supabase.co";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin} ${supabaseWebsocketOrigin} https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://checkout.razorpay.com`,
    "frame-src https://api.razorpay.com https://checkout.razorpay.com",
    "media-src 'self' data: blob: https://*.supabase.co",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; ");
}

export const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

function normalizeOrigin(value) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export default nextConfig;
