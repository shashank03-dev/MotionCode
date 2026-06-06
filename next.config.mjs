/** @type {import('next').NextConfig} */
const scriptSrc = [
  "script-src",
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
].join(" ");

const connectSrc = [
  "connect-src",
  "'self'",
  ...(process.env.NODE_ENV === "development"
    ? ["ws://localhost:*", "ws://127.0.0.1:*"]
    : []),
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  connectSrc,
  "media-src 'self' blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self), clipboard-write=(self)",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
