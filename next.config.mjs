/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A self-contained server.js + traced node_modules, not the whole repo -
  // the difference between "deploy anywhere that runs a Node server" being
  // an actual small artifact versus copying the entire project tree.
  output: "standalone",
  // Don't advertise the framework to every client - a real, if minor,
  // fingerprinting surface for free.
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ["src"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
