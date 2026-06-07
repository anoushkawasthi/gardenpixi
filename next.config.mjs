/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static-site-only constraint (PRD §14): emit a fully static `out/`.
  output: "export",
  reactStrictMode: true,
  // Static export cannot use the Image Optimization server.
  images: { unoptimized: true },
};

export default nextConfig;
