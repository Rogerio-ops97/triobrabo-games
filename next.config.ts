import type { NextConfig } from "next";

const hosts = [
  "assets.isthereanydeal.com",
  "dbxce1spal1df.cloudfront.net",
  "images.igdb.com",
  "cdn.akamai.steamstatic.com",
  "cdn.cloudflare.steamstatic.com",
  "shared.fastly.steamstatic.com",
  "shared.akamai.steamstatic.com",
  "www.gamerpower.com",
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: hosts.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "upgrade-insecure-requests",
    ].join("; ");
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ],
    }];
  },
};

export default nextConfig;
