/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/generate': ['./FDR_SYSTEM_PROMPT.md'],
      '/api/build-ai': ['./FDR_SYSTEM_PROMPT.md'],
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
