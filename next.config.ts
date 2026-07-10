const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-8a7f898b82314e1f905b0c3ffd16e076.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-4a6c1f94c9fd4cdc8efa9b0d5804c447.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pub-c6197ba4bb6a4480a69c99253de2bbf8.r2.dev",
      },
      {
        protocol: "https",
        hostname: "cetwdvlytnggcipugraq.supabase.co",
      },
    ],
  },
};

export default nextConfig;
