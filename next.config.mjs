/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // A self-contained server.js + traced node_modules, not the whole repo -
  // the difference between "deploy anywhere that runs a Node server" being
  // an actual small artifact versus copying the entire project tree.
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ["src"],
  },
};

export default nextConfig;
