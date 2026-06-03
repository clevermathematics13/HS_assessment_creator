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
    // pdf-parse requires these to be externalized
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      'canvas',
    ];
    return config;
  },
  serverExternalPackages: ['pdf-parse', 'mammoth'],
};

export default nextConfig;
