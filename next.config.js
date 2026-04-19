/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true, 
  },
  experimental: {
     // Limit workers to prevent ENOBUFS database connection overload
     cpus: 2,
     workerThreads: false,
  }
};

export default nextConfig;
