/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['encrypted-tbn0.gstatic.com','via.placeholder.com','firebasestorage.googleapis.com'],
  },
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        { key: 'Pragma', value: 'no-cache' },
        { key: 'Expires', value: '0' },
        { key: 'Surrogate-Control', value: 'no-store' },
      ],
    },
    {
      source: '/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
      ],
    },
  ],
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
