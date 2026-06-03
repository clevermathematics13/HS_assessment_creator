/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/generate': ['./FDR_SYSTEM_PROMPT.md'],
      '/api/build-ai': ['./FDR_SYSTEM_PROMPT.md'],
    },
    // Next.js 14 key for server-side external packages
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
