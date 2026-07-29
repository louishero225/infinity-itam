import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "192.168.1.161",
    "192.168.1.161:3000",
  ],
};

export default nextConfig;
