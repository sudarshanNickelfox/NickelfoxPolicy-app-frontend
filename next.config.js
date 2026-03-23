/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "frame-src 'self' https://view.officeapps.live.com https://*.supabase.co",
              "img-src 'self' data: https:",
              "connect-src 'self' http://localhost:4000 https://nickelfoxpolicy-app-serverend.onrender.com https://*.supabase.co https://graph.microsoft.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
