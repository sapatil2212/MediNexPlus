const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  distDir: isDev ? ".next-dev" : ".next",
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/subdept/:slug/dashboard",
        destination: "/subdept/dashboard",
      },
    ];
  },
};

export default nextConfig;
