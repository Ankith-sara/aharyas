import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
      type: 'asset/resource',
    });
    return config;
  },
  async redirects() {
    return [
      { source: '/privacypolicy', destination: '/privacy-policy', permanent: true },
      { source: '/refundpolicy', destination: '/refund-policy', permanent: true },
      { source: '/shippingpolicy', destination: '/shipping-policy', permanent: true },
      { source: '/delivery-policy', destination: '/shipping-policy', permanent: true },
      { source: '/termsconditions', destination: '/terms-conditions', permanent: true },
      { source: '/terms', destination: '/terms-conditions', permanent: true },
    ];
  },
};

export default nextConfig;
