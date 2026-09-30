import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["pino", "mysql2", "sharp"],
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
