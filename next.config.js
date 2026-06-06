/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Include markdown when tracing server bundles (dynamic slug reads / edge deployments).
    outputFileTracingIncludes: {
      '/*': ['./content/**/*'],
    },
  },
  async redirects() {
    return [
      {
        source: '/cities',
        destination: '/city-guides',
        permanent: true,
      },
      {
        source: '/cities/best-cities-for-3000-budget',
        destination: '/city-guides/best-cities-for-3000-month-budget-2026',
        permanent: true,
      },
      {
        source: '/cities/best-cities-for-5000-budget',
        destination: '/city-guides/best-cities-for-5000-month-budget-2026',
        permanent: true,
      },
      {
        source: '/cities/:slug',
        destination: '/city-guides/:slug',
        permanent: true,
      },
      {
        source: '/blog/best-countries-to-retire-2026',
        destination: '/blog/best-country-to-retire-in-2026-top-picks-ranked',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
