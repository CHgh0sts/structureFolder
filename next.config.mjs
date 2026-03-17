/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  serverExternalPackages: ["chokidar", "bcryptjs", "jsonwebtoken", "@prisma/client", "prisma"],
};

export default nextConfig;
