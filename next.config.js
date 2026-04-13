/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Using custom /api/proxy with Sharp for superior control and reliability
  images: {
    unoptimized: true, 
  },
};

export default nextConfig;
