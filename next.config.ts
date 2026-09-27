import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["pino", "mysql2", "sharp"],
};

export default nextConfig;
