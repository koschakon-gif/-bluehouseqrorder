/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/admin', destination: '/admin/menu', permanent: false },
      { source: '/menu', destination: '/admin/menu', permanent: false },
      { source: '/kitchen/menu', destination: '/admin/menu', permanent: false },
      { source: '/products', destination: '/admin/menu', permanent: false },
    ]
  },
}

module.exports = nextConfig
