/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Include markdown when tracing server bundles (dynamic slug reads / edge deployments).
    outputFileTracingIncludes: {
      '/*': ['./content/**/*'],
    },
  },
}

module.exports = nextConfig
