/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true, 
  },
  experimental: {
    // instrumentationHook: true, // enabled by default in Next.js 16
  }
};

export default nextConfig;
