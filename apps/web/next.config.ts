import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // External Developer API Calls (e.g. from Postman or CURL hitting /api/v1/...)
        source: '/api/v1/:path*',
        destination: (process.env.API_URL) + '/:path*',
      },
      {
        // Internal Next.js Calls (Frontend hitting /api/...)
        source: '/api/:path*',
        destination: (process.env.API_URL) + '/:path*',
      },
    ];
  },
};

export default nextConfig;
