import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    if (!config.watchOptions.ignored) {
      config.watchOptions.ignored = [];
    }
    if (Array.isArray(config.watchOptions.ignored)) {
      config.watchOptions.ignored.push(/Application Data/);
    }
    return config;
  },
};

export default nextConfig;
