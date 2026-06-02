/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/generate': ['./FDR_SYSTEM_PROMPT.md'],
    },
  },
  webpack: (config) => {
    // Allow pdfjs-dist to be bundled correctly
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
