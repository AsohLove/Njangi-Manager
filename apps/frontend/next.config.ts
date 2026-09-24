import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.18"],

  // Add your rewrites configuration here
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*", // Maps to your backend
      },
    ];
  },
};

export default nextConfig;
