/** @type {import('next').NextConfig} */

const SUPABASE_HOSTNAME = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const CSP = [
  "default-src 'self'",
  // Next.js hydration requires unsafe-eval + unsafe-inline; narrow this once you add a CSP nonce
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  // Tailwind + inline styles from Next.js require unsafe-inline
  "style-src 'self' 'unsafe-inline'",
  // Avatar images, uploaded blobs, Google user profile pictures
  "img-src 'self' blob: data: https:",
  "font-src 'self'",
  // Supabase REST + Realtime, Google OAuth, OpenRouter
  `connect-src 'self' https://${SUPABASE_HOSTNAME} wss://${SUPABASE_HOSTNAME} https://accounts.google.com https://openrouter.ai`,
  // No external frames ever
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // Prevent embedding in iframes (defense-in-depth alongside CSP frame-ancestors)
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing away from the declared content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Force HTTPS for 2 years, include subdomains, and submit to preload list
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Don't send Referer header to cross-origin sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features we don't use
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
