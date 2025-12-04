import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude OLD directories from Next.js file system routing
  webpack: (config) => {
    // Ignore files in [OLD] directories during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored) 
          ? config.watchOptions.ignored 
          : [config.watchOptions?.ignored].filter(Boolean)),
        '**/[OLD]**',
      ],
    };
    return config;
  },
};

export default nextConfig;
