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
};

export default nextConfig;
